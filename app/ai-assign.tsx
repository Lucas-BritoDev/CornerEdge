import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Cpu, Sparkles, Check, X, RefreshCw, ChevronRight, Users, BarChart3 } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';
import { getDistributionSuggestions } from '../services/ai-distribution';

const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() },
    { id: '2', name: 'João Santos', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() },
    { id: '3', name: 'Ana Oliveira', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() },
];

const PENDING_TASKS: HouseholdTask[] = [
    { id: '1', name: 'Lavar a louça', category: 'cozinha', frequency: 'daily', priority: 'high', points: 15, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '2', name: 'Aspirar a sala', category: 'limpeza', frequency: 'weekly', priority: 'medium', points: 20, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '3', name: 'Limpar banheiro', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 25, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '4', name: 'Regar plantas', category: 'jardim', frequency: 'daily', priority: 'low', points: 5, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '5', name: 'Organizar armário', category: 'quarto', frequency: 'monthly', priority: 'low', points: 30, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '6', name: 'Tirar o lixo', category: 'limpeza', frequency: 'daily', priority: 'medium', points: 10, completed: false, createdAt: Date.now(), createdBy: '1' },
];

export default function AIAssignScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [distribution, setDistribution] = useState<ReturnType<typeof getDistributionSuggestions> | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const spinValue = React.useRef(new Animated.Value(0)).current;

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

    const analyzeAndDistribute = () => {
        setIsAnalyzing(true);

        // Spin animation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();

        // Simulate AI processing time
        setTimeout(() => {
            const result = getDistributionSuggestions(PENDING_TASKS, MOCK_MEMBERS);
            setDistribution(result);
            setIsAnalyzing(false);
            spinValue.setValue(0);
        }, 2000);
    };

    const applyDistribution = () => {
        Alert.alert(
            'Distribuição Aplicada! ✅',
            'Todas as tarefas foram atribuídas aos moradores conforme a sugestão da IA.',
            [{ text: 'OK', onPress: () => setShowConfirmModal(false) }]
        );
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const getMemberAssignmentCount = (memberId: string) => {
        if (!distribution) return 0;
        return distribution.assignments.filter(a => a.member.id === memberId).length;
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
                    <Text style={styles.headerTitle}>IA de Distribuição</Text>
                </View>
                <Cpu color={colors.white} size={24} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* AI Card */}
                <View style={[styles.aiCard, { backgroundColor: cardColor }]}>
                    <View style={styles.aiHeader}>
                        <View style={styles.aiIcon}>
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <Sparkles color={colors.primary} size={32} />
                            </Animated.View>
                        </View>
                        <View style={styles.aiInfo}>
                            <Text style={[styles.aiTitle, { color: textColor }]}>Distribuição Inteligente</Text>
                            <Text style={[styles.aiSubtitle, { color: mutedColor }]}>
                                A IA analisa histórico, preferências e carga de trabalho para distribuir tarefas de forma justa.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
                        onPress={analyzeAndDistribute}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <RefreshCw color={colors.white} size={20} />
                                </Animated.View>
                                <Text style={styles.analyzeButtonText}>Analisando...</Text>
                            </>
                        ) : (
                            <>
                                <Cpu color={colors.white} size={20} />
                                <Text style={styles.analyzeButtonText}>
                                    {distribution ? 'Redistribuir' : 'Analisar e Distribuir'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Pending Tasks Summary */}
                <View style={[styles.summaryCard, { backgroundColor: cardColor }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: textColor }]}>{PENDING_TASKS.length}</Text>
                            <Text style={[styles.summaryLabel, { color: mutedColor }]}>Tarefas</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: textColor }]}>{MOCK_MEMBERS.length}</Text>
                            <Text style={[styles.summaryLabel, { color: mutedColor }]}>Moradores</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: distribution ? colors.success : mutedColor }]}>
                                {distribution ? `${distribution.fairnessScore}%` : '—'}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: mutedColor }]}>Justiça</Text>
                        </View>
                    </View>
                </View>

                {/* Distribution Results */}
                {distribution && (
                    <>
                        {/* Member Overview */}
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>DISTRIBUIÇÃO POR MORADOR</Text>
                        <View style={[styles.membersOverview, { backgroundColor: cardColor }]}>
                            {MOCK_MEMBERS.map(member => {
                                const count = getMemberAssignmentCount(member.id);
                                const percentage = (count / PENDING_TASKS.length) * 100;

                                return (
                                    <View key={member.id} style={styles.memberOverviewRow}>
                                        <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.memberOverviewInfo}>
                                            <Text style={[styles.memberOverviewName, { color: textColor }]}>
                                                {member.name.split(' ')[0]}
                                            </Text>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${percentage}%`, backgroundColor: colors.primary }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                        <Text style={[styles.memberOverviewCount, { color: textColor }]}>
                                            {count} {count === 1 ? 'tarefa' : 'tarefas'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Detailed Assignments */}
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>ATRIBUIÇÕES SUGERIDAS</Text>
                        {distribution.assignments.map(({ task, member, reasoning }) => {
                            const category = getCategoryInfo(task.category);

                            return (
                                <View key={task.id} style={[styles.assignmentCard, { backgroundColor: cardColor }]}>
                                    <View style={styles.assignmentTask}>
                                        <View style={[styles.taskIcon, { backgroundColor: category.color + '20' }]}>
                                            <Text style={styles.taskEmoji}>{category.icon}</Text>
                                        </View>
                                        <View style={styles.taskInfo}>
                                            <Text style={[styles.taskName, { color: textColor }]}>{task.name}</Text>
                                            <Text style={[styles.taskCategory, { color: mutedColor }]}>{category.name}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.assignmentArrow}>
                                        <ChevronRight color={mutedColor} size={20} />
                                    </View>
                                    <View style={styles.assignmentMember}>
                                        <View style={[styles.assignedAvatar, { backgroundColor: colors.success }]}>
                                            <Text style={styles.assignedAvatarText}>{member.name.charAt(0)}</Text>
                                        </View>
                                        <Text style={[styles.assignedName, { color: textColor }]}>
                                            {member.name.split(' ')[0]}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Apply Button */}
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowConfirmModal(true)}
                        >
                            <Check color={colors.white} size={20} />
                            <Text style={styles.applyButtonText}>Aplicar Distribuição</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* How it works */}
                {!distribution && (
                    <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                        <Text style={[styles.infoTitle, { color: textColor }]}>🤖 Como a IA funciona?</Text>
                        <View style={styles.infoItem}>
                            <View style={styles.infoNumber}><Text style={styles.infoNumberText}>1</Text></View>
                            <Text style={[styles.infoText, { color: mutedColor }]}>
                                <Text style={{ fontWeight: '600' }}>Balanceamento:</Text> Distribui tarefas igualmente
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <View style={styles.infoNumber}><Text style={styles.infoNumberText}>2</Text></View>
                            <Text style={[styles.infoText, { color: mutedColor }]}>
                                <Text style={{ fontWeight: '600' }}>Rotatividade:</Text> Evita repetir a mesma pessoa
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <View style={styles.infoNumber}><Text style={styles.infoNumberText}>3</Text></View>
                            <Text style={[styles.infoText, { color: mutedColor }]}>
                                <Text style={{ fontWeight: '600' }}>Preferências:</Text> Considera gostos de cada um
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <View style={styles.infoNumber}><Text style={styles.infoNumberText}>4</Text></View>
                            <Text style={[styles.infoText, { color: mutedColor }]}>
                                <Text style={{ fontWeight: '600' }}>Disponibilidade:</Text> Analisa atividade recente
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Confirm Modal */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Confirmar Distribuição</Text>
                            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                                <X color={mutedColor} size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.modalIcon}>
                                <Sparkles color={colors.primary} size={48} />
                            </View>
                            <Text style={[styles.modalText, { color: mutedColor }]}>
                                {PENDING_TASKS.length} tarefas serão atribuídas aos moradores conforme a sugestão da IA.
                            </Text>
                            {distribution && (
                                <View style={styles.modalStats}>
                                    <View style={styles.modalStat}>
                                        <BarChart3 color={colors.success} size={20} />
                                        <Text style={[styles.modalStatText, { color: textColor }]}>
                                            {distribution.fairnessScore}% de justiça
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={[styles.modalCancelText, { color: mutedColor }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={applyDistribution}
                            >
                                <Check color={colors.white} size={18} />
                                <Text style={styles.modalConfirmText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: '#059669',
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

    // AI Card
    aiCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    aiHeader: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    aiIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    aiInfo: { flex: 1 },
    aiTitle: { fontSize: fontSize.lg, fontWeight: 'bold' },
    aiSubtitle: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 20 },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    analyzeButtonDisabled: { backgroundColor: colors.textMuted },
    analyzeButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },

    // Summary Card
    summaryCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    summaryRow: { flexDirection: 'row' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: 'bold' },
    summaryLabel: { fontSize: fontSize.xs, marginTop: 2 },
    summaryDivider: { width: 1, backgroundColor: '#E5E7EB', height: '100%' },

    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },

    // Members Overview
    membersOverview: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    memberOverviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    memberAvatarText: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
    memberOverviewInfo: { flex: 1, marginRight: spacing.md },
    memberOverviewName: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: 4 },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3 },
    memberOverviewCount: { fontSize: fontSize.sm },

    // Assignment Card
    assignmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    assignmentTask: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    taskEmoji: { fontSize: 20 },
    taskInfo: { flex: 1 },
    taskName: { fontSize: fontSize.sm, fontWeight: '500' },
    taskCategory: { fontSize: fontSize.xs, marginTop: 2 },
    assignmentArrow: { marginHorizontal: spacing.sm },
    assignmentMember: { alignItems: 'center', width: 60 },
    assignedAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    assignedAvatarText: { color: colors.white, fontSize: fontSize.sm, fontWeight: 'bold' },
    assignedName: { fontSize: fontSize.xs },

    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    applyButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },

    // Info Card
    infoCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    infoTitle: { fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.md },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    infoNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoNumberText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: 'bold' },
    infoText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    modalBody: { alignItems: 'center', marginBottom: spacing.lg },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    modalText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
    modalStats: { marginTop: spacing.md },
    modalStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    modalStatText: { fontSize: fontSize.md, fontWeight: '500' },
    modalActions: { flexDirection: 'row', gap: spacing.md },
    modalCancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalCancelText: { fontSize: fontSize.md },
    modalConfirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    modalConfirmText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
