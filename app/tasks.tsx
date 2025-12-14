import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Menu, Plus, Check, Clock, Calendar, User, ChevronRight, X, Flag
} from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_FREQUENCIES, HouseholdTask } from '../types';

// Mock data for demonstration
const MOCK_TASKS: HouseholdTask[] = [
    {
        id: '1',
        name: 'Lavar a louça',
        description: 'Lavar toda a louça do almoço',
        category: 'cozinha',
        frequency: 'daily',
        assignedTo: 'user1',
        priority: 'medium',
        points: 10,
        completed: false,
        createdAt: Date.now(),
        createdBy: 'user1'
    },
    {
        id: '2',
        name: 'Aspirar a sala',
        description: 'Passar aspirador em toda a sala',
        category: 'limpeza',
        frequency: 'weekly',
        assignedTo: 'user2',
        priority: 'high',
        points: 20,
        completed: false,
        createdAt: Date.now(),
        createdBy: 'user1'
    },
    {
        id: '3',
        name: 'Regar as plantas',
        category: 'jardim',
        frequency: 'daily',
        priority: 'low',
        points: 5,
        completed: true,
        createdAt: Date.now(),
        createdBy: 'user1'
    }
];

export default function TasksScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [tasks, setTasks] = useState<HouseholdTask[]>(MOCK_TASKS);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('limpeza');
    const [selectedFrequency, setSelectedFrequency] = useState('daily');
    const [selectedPriority, setSelectedPriority] = useState('medium');

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

    const toggleTaskComplete = (taskId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        ));
    };

    const addTask = () => {
        if (!newTaskName.trim()) {
            Alert.alert('Atenção', 'Digite o nome da tarefa');
            return;
        }

        const newTask: HouseholdTask = {
            id: Date.now().toString(),
            name: newTaskName.trim(),
            category: selectedCategory as any,
            frequency: selectedFrequency as any,
            priority: selectedPriority as any,
            points: selectedPriority === 'high' ? 20 : selectedPriority === 'medium' ? 10 : 5,
            completed: false,
            createdAt: Date.now(),
            createdBy: user?.id || 'user1'
        };

        setTasks([newTask, ...tasks]);
        setNewTaskName('');
        setShowAddModal(false);
    };

    const getCategoryInfo = (categoryId: string) => {
        return TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[0];
    };

    const getPriorityInfo = (priorityId: string) => {
        return TASK_PRIORITIES.find(p => p.id === priorityId) || TASK_PRIORITIES[1];
    };

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Tarefas</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Plus color={colors.white} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Pending Tasks */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                        PENDENTES ({pendingTasks.length})
                    </Text>
                    {pendingTasks.map(task => {
                        const category = getCategoryInfo(task.category);
                        const priority = getPriorityInfo(task.priority);
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
                                    <View style={styles.taskMeta}>
                                        <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
                                            <Flag color={priority.color} size={12} />
                                            <Text style={[styles.priorityText, { color: priority.color }]}>
                                                {priority.name}
                                            </Text>
                                        </View>
                                        <Text style={[styles.taskPoints, { color: mutedColor }]}>
                                            +{task.points} pts
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.checkCircle}>
                                    <View style={styles.checkCircleInner} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                            CONCLUÍDAS ({completedTasks.length})
                        </Text>
                        {completedTasks.map(task => {
                            const category = getCategoryInfo(task.category);
                            return (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.taskCard, styles.taskCardCompleted, { backgroundColor: cardColor }]}
                                    onPress={() => toggleTaskComplete(task.id)}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20', opacity: 0.5 }]}>
                                        <Text style={styles.categoryEmoji}>{category.icon}</Text>
                                    </View>
                                    <View style={styles.taskInfo}>
                                        <Text style={[styles.taskName, styles.taskNameCompleted, { color: mutedColor }]}>
                                            {task.name}
                                        </Text>
                                    </View>
                                    <View style={[styles.checkCircle, styles.checkCircleCompleted]}>
                                        <Check color={colors.white} size={16} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Add Task Modal */}
            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Nova Tarefa</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <X color={mutedColor} size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome da Tarefa</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]}
                            value={newTaskName}
                            onChangeText={setNewTaskName}
                            placeholder="Ex: Lavar a louça"
                            placeholderTextColor={mutedColor}
                        />

                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                            {TASK_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.optionChip,
                                        selectedCategory === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Text style={styles.optionEmoji}>{cat.icon}</Text>
                                    <Text style={[styles.optionText, { color: selectedCategory === cat.id ? cat.color : mutedColor }]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Prioridade</Text>
                        <View style={styles.priorityRow}>
                            {TASK_PRIORITIES.map(pri => (
                                <TouchableOpacity
                                    key={pri.id}
                                    style={[
                                        styles.priorityOption,
                                        selectedPriority === pri.id && { backgroundColor: pri.color + '30', borderColor: pri.color }
                                    ]}
                                    onPress={() => setSelectedPriority(pri.id)}
                                >
                                    <Flag color={selectedPriority === pri.id ? pri.color : mutedColor} size={16} />
                                    <Text style={[styles.priorityOptionText, { color: selectedPriority === pri.id ? pri.color : mutedColor }]}>
                                        {pri.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={addTask}>
                            <Text style={styles.saveButtonText}>Criar Tarefa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    addButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: spacing.sm,
        borderRadius: borderRadius.md
    },
    content: { flex: 1 },
    section: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
    sectionTitle: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.md, letterSpacing: 0.5 },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    taskCardCompleted: { opacity: 0.7 },
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
    taskName: { fontSize: fontSize.md, fontWeight: '600', marginBottom: 4 },
    taskNameCompleted: { textDecorationLine: 'line-through' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        gap: 4
    },
    priorityText: { fontSize: fontSize.xs, fontWeight: '500' },
    taskPoints: { fontSize: fontSize.sm },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkCircleInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    checkCircleCompleted: {
        backgroundColor: colors.success,
        borderColor: colors.success
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
    modalContent: { borderRadius: borderRadius.lg, padding: spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    inputLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.md },
    modalInput: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md },
    optionsRow: { flexDirection: 'row', marginTop: spacing.sm },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        gap: 6
    },
    optionEmoji: { fontSize: 16 },
    optionText: { fontSize: fontSize.sm },
    priorityRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    priorityOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6
    },
    priorityOptionText: { fontSize: fontSize.sm, fontWeight: '500' },
    saveButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.xl },
    saveButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
