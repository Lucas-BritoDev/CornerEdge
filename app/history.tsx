import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Check } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DrawerMenu } from '../components/DrawerMenu';
import { HouseholdTask, TASK_CATEGORIES } from '../types';

// Mock history data
const MOCK_HISTORY: (HouseholdTask & { completedAt: number; completedBy: string })[] = [
    { id: '1', name: 'Lavar a louça', category: 'cozinha', frequency: 'daily', priority: 'medium', points: 10, completed: true, createdAt: Date.now() - 86400000, createdBy: '1', completedAt: Date.now() - 3600000, completedBy: 'Maria' },
    { id: '2', name: 'Aspirar a sala', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 20, completed: true, createdAt: Date.now() - 172800000, createdBy: '1', completedAt: Date.now() - 86400000, completedBy: 'João' },
    { id: '3', name: 'Regar as plantas', category: 'jardim', frequency: 'daily', priority: 'low', points: 5, completed: true, createdAt: Date.now() - 259200000, createdBy: '1', completedAt: Date.now() - 172800000, completedBy: 'Ana' },
    { id: '4', name: 'Organizar armário', category: 'organizacao', frequency: 'monthly', priority: 'medium', points: 25, completed: true, createdAt: Date.now() - 345600000, createdBy: '1', completedAt: Date.now() - 259200000, completedBy: 'Pedro' },
    { id: '5', name: 'Limpar banheiro', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 20, completed: true, createdAt: Date.now() - 432000000, createdBy: '1', completedAt: Date.now() - 345600000, completedBy: 'Maria' },
];

export default function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [history] = useState(MOCK_HISTORY);
    const [menuOpen, setMenuOpen] = useState(false);

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

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Hoje às ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Calculate stats
    const totalPoints = history.reduce((sum, t) => sum + t.points, 0);

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header with Hamburger Menu */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
                    <Text style={styles.headerTitle}>Histórico de Tarefas</Text>
                </View>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                    <Text style={[styles.statValue, { color: textColor }]}>{history.length}</Text>
                    <Text style={[styles.statLabel, { color: mutedColor }]}>Tarefas</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                    <Text style={[styles.statValue, { color: colors.success }]}>+{totalPoints}</Text>
                    <Text style={[styles.statLabel, { color: mutedColor }]}>Pontos</Text>
                </View>
            </View>

            <FlatList
                data={history}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
                ListEmptyComponent={
                    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                        <Text style={styles.emptyEmoji}>📋</Text>
                        <Text style={[styles.emptyText, { color: textColor }]}>Nenhuma tarefa concluída ainda</Text>
                        <Text style={[styles.emptySubtext, { color: mutedColor }]}>Complete tarefas para ver o histórico</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const category = getCategoryInfo(item.category);
                    return (
                        <View style={[styles.card, { backgroundColor: cardColor }]}>
                            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                <Text style={styles.categoryEmoji}>{category.icon}</Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={[styles.taskName, { color: textColor }]}>{item.name}</Text>
                                <View style={styles.meta}>
                                    <View style={styles.completedBadge}>
                                        <Check color={colors.success} size={12} />
                                        <Text style={[styles.completedBy, { color: mutedColor }]}>
                                            {item.completedBy}
                                        </Text>
                                    </View>
                                    <Text style={[styles.date, { color: mutedColor }]}>
                                        {formatDate(item.completedAt)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>+{item.points}</Text>
                            </View>
                        </View>
                    );
                }}
            />

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        backgroundColor: colors.purple,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    menuButton: { padding: spacing.sm, marginRight: spacing.md },
    headerTextContainer: { flex: 1 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    headerTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },

    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    statValue: { fontSize: fontSize['2xl'], fontWeight: 'bold' },
    statLabel: { fontSize: fontSize.xs, marginTop: 2 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    categoryEmoji: { fontSize: 24 },
    info: { flex: 1 },
    taskName: { fontSize: fontSize.md, fontWeight: '600', marginBottom: 4 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    completedBy: { fontSize: fontSize.xs },
    date: { fontSize: fontSize.xs },
    pointsBadge: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    pointsText: { color: colors.success, fontSize: fontSize.sm, fontWeight: 'bold' },
    emptyState: {
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: 4 },
    emptySubtext: { fontSize: fontSize.md },
});
