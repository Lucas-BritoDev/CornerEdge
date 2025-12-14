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
import { Menu, Gift, Star, ShoppingBag, Check, X, Lock, Sparkles } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface Reward {
    id: string;
    name: string;
    description: string;
    emoji: string;
    cost: number;
    category: 'privilege' | 'skip' | 'special';
    available: boolean;
}

const REWARDS: Reward[] = [
    { id: '1', name: 'Escolher filme na sexta', description: 'Você decide o filme da sessão em família', emoji: '🎬', cost: 100, category: 'privilege', available: true },
    { id: '2', name: 'Pular 1 tarefa', description: 'Escolha uma tarefa para não fazer por 1 dia', emoji: '⏭️', cost: 150, category: 'skip', available: true },
    { id: '3', name: 'Controle do ar-condicionado', description: 'Você decide a temperatura por 1 dia', emoji: '❄️', cost: 80, category: 'privilege', available: true },
    { id: '4', name: 'Escolher jantar', description: 'Decida o que a família vai jantar', emoji: '🍕', cost: 60, category: 'privilege', available: true },
    { id: '5', name: 'Dia de folga', description: 'Sem tarefas por um dia inteiro', emoji: '🏖️', cost: 300, category: 'skip', available: true },
    { id: '6', name: 'Trocar tarefa', description: 'Troque uma tarefa sua com outro morador', emoji: '🔄', cost: 50, category: 'skip', available: true },
    { id: '7', name: 'Banheiro primeiro', description: 'Prioridade no banheiro pela manhã', emoji: '🚿', cost: 40, category: 'privilege', available: true },
    { id: '8', name: 'Coroa de ouro', description: 'Ícone especial no ranking por 1 semana', emoji: '👑', cost: 200, category: 'special', available: true },
    { id: '9', name: 'Dobrar pontos', description: 'Próxima tarefa vale pontos em dobro', emoji: '✨', cost: 120, category: 'special', available: true },
    { id: '10', name: 'Veto de música', description: 'Vete uma música que você não gosta', emoji: '🎵', cost: 30, category: 'privilege', available: true },
];

const REDEEMED_HISTORY = [
    { id: 'h1', rewardName: 'Escolher filme na sexta', redeemedBy: 'Maria', date: Date.now() - 86400000 * 2, emoji: '🎬' },
    { id: 'h2', rewardName: 'Pular 1 tarefa', redeemedBy: 'João', date: Date.now() - 86400000 * 5, emoji: '⏭️' },
];

export default function RewardsScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [userPoints, setUserPoints] = useState(450);

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

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'privilege': return '🎯 Privilégio';
            case 'skip': return '⏭️ Pular';
            case 'special': return '✨ Especial';
            default: return category;
        }
    };

    const redeemReward = () => {
        if (selectedReward && userPoints >= selectedReward.cost) {
            setUserPoints(userPoints - selectedReward.cost);
            Alert.alert(
                'Recompensa Resgatada! 🎉',
                `Você resgatou "${selectedReward.name}" por ${selectedReward.cost} pontos. Aproveite!`
            );
            setShowRedeemModal(false);
            setSelectedReward(null);
        }
    };

    const formatDate = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Hoje';
        if (days === 1) return 'Ontem';
        return `Há ${days} dias`;
    };

    const privilegeRewards = REWARDS.filter(r => r.category === 'privilege');
    const skipRewards = REWARDS.filter(r => r.category === 'skip');
    const specialRewards = REWARDS.filter(r => r.category === 'special');

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Recompensas</Text>
                </View>
                <View style={styles.pointsBadge}>
                    <Star color={colors.accent} size={16} fill={colors.accent} />
                    <Text style={styles.pointsText}>{userPoints}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceIcon}>
                        <Gift color={colors.white} size={32} />
                    </View>
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>Seus Pontos</Text>
                        <Text style={styles.balanceValue}>{userPoints}</Text>
                    </View>
                    <Sparkles color={colors.white} size={24} />
                </View>

                {/* Privilege Rewards */}
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>🎯 PRIVILÉGIOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {privilegeRewards.map(reward => {
                        const canAfford = userPoints >= reward.cost;
                        return (
                            <TouchableOpacity
                                key={reward.id}
                                style={[styles.rewardCard, { backgroundColor: cardColor }, !canAfford && styles.rewardCardDisabled]}
                                onPress={() => { setSelectedReward(reward); setShowRedeemModal(true); }}
                                disabled={!canAfford}
                            >
                                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                                <Text style={[styles.rewardName, { color: textColor }]}>{reward.name}</Text>
                                <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
                                    <Star color={canAfford ? colors.accent : mutedColor} size={12} fill={canAfford ? colors.accent : mutedColor} />
                                    <Text style={[styles.costText, { color: canAfford ? colors.accent : mutedColor }]}>{reward.cost}</Text>
                                </View>
                                {!canAfford && (
                                    <View style={styles.lockedOverlay}>
                                        <Lock color={mutedColor} size={20} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Skip Rewards */}
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>⏭️ PULAR TAREFAS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {skipRewards.map(reward => {
                        const canAfford = userPoints >= reward.cost;
                        return (
                            <TouchableOpacity
                                key={reward.id}
                                style={[styles.rewardCard, { backgroundColor: cardColor }, !canAfford && styles.rewardCardDisabled]}
                                onPress={() => { setSelectedReward(reward); setShowRedeemModal(true); }}
                                disabled={!canAfford}
                            >
                                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                                <Text style={[styles.rewardName, { color: textColor }]}>{reward.name}</Text>
                                <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
                                    <Star color={canAfford ? colors.accent : mutedColor} size={12} fill={canAfford ? colors.accent : mutedColor} />
                                    <Text style={[styles.costText, { color: canAfford ? colors.accent : mutedColor }]}>{reward.cost}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Special Rewards */}
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>✨ ESPECIAIS</Text>
                <View style={styles.specialGrid}>
                    {specialRewards.map(reward => {
                        const canAfford = userPoints >= reward.cost;
                        return (
                            <TouchableOpacity
                                key={reward.id}
                                style={[styles.specialCard, { backgroundColor: cardColor }, !canAfford && styles.rewardCardDisabled]}
                                onPress={() => { setSelectedReward(reward); setShowRedeemModal(true); }}
                                disabled={!canAfford}
                            >
                                <Text style={styles.specialEmoji}>{reward.emoji}</Text>
                                <View style={styles.specialInfo}>
                                    <Text style={[styles.specialName, { color: textColor }]}>{reward.name}</Text>
                                    <Text style={[styles.specialDesc, { color: mutedColor }]}>{reward.description}</Text>
                                </View>
                                <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
                                    <Star color={canAfford ? colors.accent : mutedColor} size={12} fill={canAfford ? colors.accent : mutedColor} />
                                    <Text style={[styles.costText, { color: canAfford ? colors.accent : mutedColor }]}>{reward.cost}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* History */}
                <Text style={[styles.sectionTitle, { color: mutedColor }]}>📜 HISTÓRICO DE RESGATES</Text>
                {REDEEMED_HISTORY.map(item => (
                    <View key={item.id} style={[styles.historyItem, { backgroundColor: cardColor }]}>
                        <Text style={styles.historyEmoji}>{item.emoji}</Text>
                        <View style={styles.historyInfo}>
                            <Text style={[styles.historyName, { color: textColor }]}>{item.rewardName}</Text>
                            <Text style={[styles.historyMeta, { color: mutedColor }]}>Resgatado por {item.redeemedBy}</Text>
                        </View>
                        <Text style={[styles.historyDate, { color: mutedColor }]}>{formatDate(item.date)}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Redeem Modal */}
            <Modal visible={showRedeemModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Resgatar Recompensa</Text>
                            <TouchableOpacity onPress={() => setShowRedeemModal(false)}>
                                <X color={mutedColor} size={24} />
                            </TouchableOpacity>
                        </View>

                        {selectedReward && (
                            <>
                                <View style={styles.modalReward}>
                                    <Text style={styles.modalEmoji}>{selectedReward.emoji}</Text>
                                    <Text style={[styles.modalRewardName, { color: textColor }]}>{selectedReward.name}</Text>
                                    <Text style={[styles.modalRewardDesc, { color: mutedColor }]}>{selectedReward.description}</Text>
                                </View>

                                <View style={styles.modalCost}>
                                    <Text style={[styles.modalCostLabel, { color: mutedColor }]}>Custo:</Text>
                                    <View style={styles.modalCostValue}>
                                        <Star color={colors.accent} size={20} fill={colors.accent} />
                                        <Text style={styles.modalCostNumber}>{selectedReward.cost}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalBalance}>
                                    <Text style={[styles.modalBalanceLabel, { color: mutedColor }]}>Seu saldo após resgate:</Text>
                                    <Text style={[styles.modalBalanceValue, { color: userPoints >= selectedReward.cost ? colors.success : colors.error }]}>
                                        {userPoints - selectedReward.cost} pontos
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.redeemButton, userPoints < selectedReward.cost && styles.redeemButtonDisabled]}
                                    onPress={redeemReward}
                                    disabled={userPoints < selectedReward.cost}
                                >
                                    <ShoppingBag color={colors.white} size={20} />
                                    <Text style={styles.redeemButtonText}>
                                        {userPoints >= selectedReward.cost ? 'Resgatar Agora' : 'Pontos Insuficientes'}
                                    </Text>
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
        backgroundColor: colors.accent,
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
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    pointsText: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
    content: { flex: 1, padding: spacing.lg },

    // Balance Card
    balanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.md,
    },
    balanceIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    balanceInfo: { flex: 1 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    balanceValue: { color: colors.white, fontSize: 32, fontWeight: 'bold' },

    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },

    horizontalScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },

    // Reward Card
    rewardCard: {
        width: 140,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginRight: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
    },
    rewardCardDisabled: { opacity: 0.5 },
    rewardEmoji: { fontSize: 36, marginBottom: spacing.sm },
    rewardName: { fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    costBadgeDisabled: { backgroundColor: '#E5E7EB' },
    costText: { fontSize: fontSize.sm, fontWeight: 'bold' },
    lockedOverlay: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
    },

    // Special Cards
    specialGrid: { gap: spacing.md },
    specialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    specialEmoji: { fontSize: 32, marginRight: spacing.md },
    specialInfo: { flex: 1 },
    specialName: { fontSize: fontSize.md, fontWeight: '600' },
    specialDesc: { fontSize: fontSize.xs, marginTop: 2 },

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
    historyName: { fontSize: fontSize.sm, fontWeight: '500' },
    historyMeta: { fontSize: fontSize.xs, marginTop: 2 },
    historyDate: { fontSize: fontSize.xs },

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
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    modalReward: { alignItems: 'center', marginBottom: spacing.lg },
    modalEmoji: { fontSize: 64, marginBottom: spacing.md },
    modalRewardName: { fontSize: fontSize.xl, fontWeight: 'bold', textAlign: 'center' },
    modalRewardDesc: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.xs },
    modalCost: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalCostLabel: { fontSize: fontSize.md },
    modalCostValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    modalCostNumber: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.accent },
    modalBalance: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    modalBalanceLabel: { fontSize: fontSize.sm },
    modalBalanceValue: { fontSize: fontSize.md, fontWeight: 'bold' },
    redeemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    redeemButtonDisabled: { backgroundColor: colors.textMuted },
    redeemButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
