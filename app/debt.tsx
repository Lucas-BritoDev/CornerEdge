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
import { Menu, AlertTriangle, TrendingDown, Check, X, Clock, Zap } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';

// Mock data
interface TaskDebt {
    id: string;
    task: HouseholdTask;
    dueDate: number;
    penaltyPoints: number;
    daysOverdue: number;
}

const MOCK_DEBTS: { memberId: string; debts: TaskDebt[] }[] = [
    {
        memberId: '2',
        debts: [
            { id: 'd1', task: { id: '1', name: 'Lavar a louça', category: 'cozinha', frequency: 'daily', priority: 'medium', points: 10, completed: false, createdAt: Date.now() - 86400000 * 3, createdBy: '1' }, dueDate: Date.now() - 86400000 * 2, penaltyPoints: 5, daysOverdue: 2 },
            { id: 'd2', task: { id: '2', name: 'Tirar o lixo', category: 'limpeza', frequency: 'daily', priority: 'high', points: 5, completed: false, createdAt: Date.now() - 86400000, createdBy: '1' }, dueDate: Date.now() - 86400000, penaltyPoints: 3, daysOverdue: 1 },
        ]
    },
    {
        memberId: '3',
        debts: [
            { id: 'd3', task: { id: '3', name: 'Limpar banheiro', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 25, completed: false, createdAt: Date.now() - 86400000 * 5, createdBy: '1' }, dueDate: Date.now() - 86400000 * 3, penaltyPoints: 15, daysOverdue: 3 },
        ]
    }
];

const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() },
    { id: '2', name: 'João Santos', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() },
    { id: '3', name: 'Ana Oliveira', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() },
];

export default function DebtScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<{ member: HouseholdMember; debt: TaskDebt } | null>(null);

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

    const getTotalDebt = (debts: TaskDebt[]) => {
        return debts.reduce((sum, d) => sum + d.penaltyPoints, 0);
    };

    const payDebt = () => {
        if (selectedDebt) {
            Alert.alert(
                'Dívida Quitada! ✅',
                `${selectedDebt.member.name} completou a tarefa "${selectedDebt.debt.task.name}" e quitou a dívida de ${selectedDebt.debt.penaltyPoints} pontos.`
            );
            setShowPayModal(false);
            setSelectedDebt(null);
        }
    };

    const totalHouseDebt = MOCK_DEBTS.reduce((sum, m) => sum + getTotalDebt(m.debts), 0);
    const totalOverdueTasks = MOCK_DEBTS.reduce((sum, m) => sum + m.debts.length, 0);

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Dívida de Tarefas</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Summary Card */}
                <View style={[styles.summaryCard, totalHouseDebt > 0 && styles.summaryCardAlert]}>
                    <View style={styles.summaryIcon}>
                        <AlertTriangle color={totalHouseDebt > 0 ? colors.error : colors.success} size={32} />
                    </View>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryTitle}>
                            {totalHouseDebt > 0 ? 'Atenção!' : 'Tudo em dia!'}
                        </Text>
                        <Text style={styles.summaryText}>
                            {totalHouseDebt > 0
                                ? `${totalOverdueTasks} tarefas atrasadas acumulando ${totalHouseDebt} pontos de penalidade`
                                : 'Nenhuma dívida na casa. Parabéns!'
                            }
                        </Text>
                    </View>
                </View>

                {/* Debt by Member */}
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>DÍVIDAS POR MORADOR</Text>

                {MOCK_DEBTS.map(memberDebt => {
                    const member = MOCK_MEMBERS.find(m => m.id === memberDebt.memberId);
                    if (!member) return null;
                    const totalDebt = getTotalDebt(memberDebt.debts);

                    return (
                        <View key={member.id} style={[styles.debtCard, { backgroundColor: cardColor }]}>
                            <View style={styles.debtHeader}>
                                <View style={styles.debtMember}>
                                    <View style={[styles.memberAvatar, { backgroundColor: colors.error }]}>
                                        <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.memberName, { color: textColor }]}>{member.name}</Text>
                                        <Text style={[styles.debtCount, { color: mutedColor }]}>
                                            {memberDebt.debts.length} tarefa(s) atrasada(s)
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.debtBadge}>
                                    <TrendingDown color={colors.error} size={16} />
                                    <Text style={styles.debtBadgeText}>-{totalDebt} pts</Text>
                                </View>
                            </View>

                            {memberDebt.debts.map(debt => {
                                const category = getCategoryInfo(debt.task.category);
                                return (
                                    <TouchableOpacity
                                        key={debt.id}
                                        style={styles.debtItem}
                                        onPress={() => { setSelectedDebt({ member, debt }); setShowPayModal(true); }}
                                    >
                                        <View style={[styles.taskIcon, { backgroundColor: category.color + '20' }]}>
                                            <Text style={styles.taskEmoji}>{category.icon}</Text>
                                        </View>
                                        <View style={styles.taskInfo}>
                                            <Text style={[styles.taskName, { color: textColor }]}>{debt.task.name}</Text>
                                            <View style={styles.taskMeta}>
                                                <Clock color={colors.error} size={12} />
                                                <Text style={styles.overdueText}>{debt.daysOverdue} dia(s) atrasado</Text>
                                            </View>
                                        </View>
                                        <View style={styles.penaltyBadge}>
                                            <Text style={styles.penaltyText}>-{debt.penaltyPoints}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity
                                style={styles.payAllButton}
                                onPress={() => Alert.alert('Quitar Todas', `${member.name} precisa completar todas as tarefas para quitar a dívida.`)}
                            >
                                <Zap color={colors.primary} size={16} />
                                <Text style={styles.payAllText}>Quitar Todas as Dívidas</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {MOCK_DEBTS.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                        <Text style={styles.emptyEmoji}>🎉</Text>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Casa sem dívidas!</Text>
                        <Text style={[styles.emptySubtitle, { color: mutedColor }]}>
                            Todos estão em dia com suas tarefas
                        </Text>
                    </View>
                )}

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#374151' : '#EEF2FF' }]}>
                    <Text style={[styles.infoTitle, { color: textColor }]}>💡 Como funciona?</Text>
                    <Text style={[styles.infoText, { color: mutedColor }]}>
                        • Tarefas não completadas no prazo viram "dívida"{'\n'}
                        • Cada dia de atraso acumula pontos de penalidade{'\n'}
                        • Penalidades são descontadas do ranking{'\n'}
                        • Complete a tarefa para quitar a dívida
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Debt Modal */}
            <Modal visible={showPayModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Quitar Dívida</Text>
                            <TouchableOpacity onPress={() => setShowPayModal(false)}>
                                <X color={mutedColor} size={24} />
                            </TouchableOpacity>
                        </View>

                        {selectedDebt && (
                            <>
                                <View style={styles.modalTask}>
                                    <Text style={styles.modalTaskEmoji}>
                                        {getCategoryInfo(selectedDebt.debt.task.category).icon}
                                    </Text>
                                    <Text style={[styles.modalTaskName, { color: textColor }]}>
                                        {selectedDebt.debt.task.name}
                                    </Text>
                                </View>

                                <View style={styles.modalInfo}>
                                    <View style={styles.modalInfoRow}>
                                        <Text style={[styles.modalLabel, { color: mutedColor }]}>Responsável:</Text>
                                        <Text style={[styles.modalValue, { color: textColor }]}>{selectedDebt.member.name}</Text>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Text style={[styles.modalLabel, { color: mutedColor }]}>Dias de atraso:</Text>
                                        <Text style={[styles.modalValue, { color: colors.error }]}>{selectedDebt.debt.daysOverdue} dias</Text>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Text style={[styles.modalLabel, { color: mutedColor }]}>Penalidade:</Text>
                                        <Text style={[styles.modalValue, { color: colors.error }]}>-{selectedDebt.debt.penaltyPoints} pontos</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.payButton} onPress={payDebt}>
                                    <Check color={colors.white} size={20} />
                                    <Text style={styles.payButtonText}>Marcar como Feita e Quitar</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
        backgroundColor: colors.error,
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

    // Summary
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    summaryCardAlert: {
        backgroundColor: '#FEE2E2',
    },
    summaryIcon: {
        marginRight: spacing.md,
    },
    summaryContent: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    summaryText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },

    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: spacing.md,
    },

    // Debt Card
    debtCard: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    debtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    debtMember: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    memberAvatarText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    debtCount: {
        fontSize: fontSize.xs,
    },
    debtBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    debtBadgeText: {
        color: colors.error,
        fontSize: fontSize.sm,
        fontWeight: 'bold',
    },

    debtItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    taskIcon: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    taskEmoji: {
        fontSize: 18,
    },
    taskInfo: {
        flex: 1,
    },
    taskName: {
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    overdueText: {
        color: colors.error,
        fontSize: fontSize.xs,
    },
    penaltyBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    penaltyText: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: 'bold',
    },

    payAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: spacing.xs,
    },
    payAllText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: '600',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
    },
    emptySubtitle: {
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },

    // Info Card
    infoCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.md,
    },
    infoTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: fontSize.sm,
        lineHeight: 22,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    modalTask: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTaskEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    modalTaskName: {
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
    modalInfo: {
        marginBottom: spacing.lg,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalLabel: {
        fontSize: fontSize.sm,
    },
    modalValue: {
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    payButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
});
