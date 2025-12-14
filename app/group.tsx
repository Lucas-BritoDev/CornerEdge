import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Users, Plus, Crown, Trash2, X, Check, Clock, LogOut, Send, MessageSquare, ClipboardList, TrendingUp, Settings, Share2, Star, Award, UserPlus } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Group, GroupMember, GroupActivity, HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';
import { useRouter } from 'expo-router';

// Mock data para demonstração
const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() - 86400000 * 30 },
    { id: '2', name: 'João Santos', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() - 86400000 * 20 },
    { id: '3', name: 'Ana Oliveira', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() - 86400000 * 10 },
];

const MOCK_TASKS: HouseholdTask[] = [
    { id: '1', name: 'Lavar a louça', category: 'cozinha', frequency: 'daily', priority: 'medium', points: 10, completed: false, createdAt: Date.now(), createdBy: '1', assignedTo: '2' },
    { id: '2', name: 'Aspirar a sala', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 20, completed: false, createdAt: Date.now(), createdBy: '1', assignedTo: '3' },
];

export default function GroupScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [household, setHousehold] = useState<{ name: string; code: string; createdAt: number } | null>({
        name: 'Casa da Família',
        code: 'FAM-1234',
        createdAt: Date.now()
    });
    const [members, setMembers] = useState<HouseholdMember[]>(MOCK_MEMBERS);
    const [tasks, setTasks] = useState<HouseholdTask[]>(MOCK_TASKS);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);

    // Inputs
    const [householdName, setHouseholdName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // WCAG 2.1 AA Compliant Colors
    const bgColor = isDark ? darkColors.background : colors.background;
    const cardColor = isDark ? darkColors.card : colors.white;
    const textColor = isDark ? darkColors.textPrimary : colors.textPrimary;
    const mutedColor = isDark ? darkColors.textMuted : colors.textMuted;
    const borderColor = isDark ? darkColors.border : colors.border;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const copyCode = async () => {
        if (!household) return;
        await Clipboard.setStringAsync(household.code);
        Alert.alert('Código Copiado! 📋', `O código ${household.code} foi copiado para a área de transferência.`);
    };

    const getMemberTasks = (memberId: string) => {
        return tasks.filter(t => t.assignedTo === memberId);
    };

    const getMemberStats = (member: HouseholdMember) => {
        const memberTasks = getMemberTasks(member.id);
        const pendingTasks = memberTasks.filter(t => !t.completed).length;
        return { pending: pendingTasks, total: memberTasks.length };
    };

    const getCategoryInfo = (categoryId: string) => {
        return TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[0];
    };

    const formatJoinDate = (timestamp: number) => {
        const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Entrou hoje';
        if (days === 1) return 'Entrou ontem';
        return `Há ${days} dias`;
    };

    // Ordenar membros por pontos
    const sortedMembers = [...members].sort((a, b) => b.points - a.points);
    const leaderMember = sortedMembers[0];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerGreeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Minha Casa</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>

                {!household ? (
                    <View style={[styles.noGroupState, { backgroundColor: cardColor }]}>
                        <Users color={colors.primary} size={48} />
                        <Text style={[styles.noGroupTitle, { color: textColor }]}>Minha Casa</Text>
                        <Text style={[styles.noGroupText, { color: mutedColor }]}>Crie ou entre em uma casa para organizar tarefas com sua família ou moradores.</Text>
                        <View style={styles.noGroupButtons}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
                                <Text style={styles.primaryBtnText}>Criar Casa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.primary }]} onPress={() => setShowJoinModal(true)}>
                                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Entrar com Código</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {/* Household Card */}
                        <View style={styles.householdCard}>
                            <View style={styles.householdHeader}>
                                <View>
                                    <Text style={styles.householdName}>{household.name}</Text>
                                    <Text style={styles.householdCode}>Código: {household.code}</Text>
                                </View>
                                <View style={styles.syncBadge}>
                                    <View style={styles.syncDot} />
                                    <Text style={styles.syncText}>ATIVO</Text>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{members.length}</Text>
                                    <Text style={styles.statLabel}>Moradores</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{tasks.filter(t => !t.completed).length}</Text>
                                    <Text style={styles.statLabel}>Tarefas Pendentes</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{members.reduce((sum, m) => sum + m.points, 0)}</Text>
                                    <Text style={styles.statLabel}>Pontos Total</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.shareButton} onPress={copyCode}>
                                <Share2 color={colors.white} size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* Leader Card */}
                        {leaderMember && (
                            <View style={[styles.leaderCard, { backgroundColor: cardColor }]}>
                                <View style={styles.leaderIcon}>
                                    <Text style={styles.leaderEmoji}>👑</Text>
                                </View>
                                <View style={styles.leaderInfo}>
                                    <Text style={[styles.leaderLabel, { color: mutedColor }]}>Líder da Semana</Text>
                                    <Text style={[styles.leaderName, { color: textColor }]}>{leaderMember.name}</Text>
                                    <Text style={[styles.leaderPoints, { color: colors.accent }]}>{leaderMember.points} pontos</Text>
                                </View>
                                <Award color={colors.accent} size={32} />
                            </View>
                        )}

                        {/* Members Section */}
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Users color={colors.primary} size={20} />
                                <Text style={[styles.sectionTitle, { color: textColor }]}>MORADORES ({members.length})</Text>
                            </View>
                            <TouchableOpacity onPress={copyCode} style={styles.addMemberBtn}>
                                <UserPlus color={colors.primary} size={16} />
                                <Text style={styles.addMemberText}>Convidar</Text>
                            </TouchableOpacity>
                        </View>

                        {sortedMembers.map((member, index) => {
                            const stats = getMemberStats(member);
                            const memberTasks = getMemberTasks(member.id);

                            return (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[styles.memberCard, { backgroundColor: cardColor }]}
                                    onPress={() => { setSelectedMember(member); setShowMembersModal(true); }}
                                >
                                    <View style={styles.memberRank}>
                                        <Text style={[styles.rankNumber, index === 0 && styles.rankFirst]}>{index + 1}</Text>
                                    </View>
                                    <View style={[styles.memberAvatar, { backgroundColor: index === 0 ? colors.accent : colors.primary }]}>
                                        <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                                        {member.role === 'admin' && (
                                            <View style={styles.adminCrown}>
                                                <Crown color="#FCD34D" size={12} fill="#FCD34D" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={[styles.memberName, { color: textColor }]}>{member.name}</Text>
                                        <View style={styles.memberMeta}>
                                            <Star color={colors.accent} size={12} fill={colors.accent} />
                                            <Text style={[styles.memberPoints, { color: mutedColor }]}>{member.points} pts</Text>
                                            <Text style={[styles.memberTasks, { color: mutedColor }]}>• {stats.pending} tarefas pendentes</Text>
                                        </View>
                                    </View>
                                    <View style={styles.memberTasksPreview}>
                                        {memberTasks.slice(0, 2).map(task => {
                                            const cat = getCategoryInfo(task.category);
                                            return (
                                                <View key={task.id} style={[styles.taskMini, { backgroundColor: cat.color + '20' }]}>
                                                    <Text style={styles.taskMiniEmoji}>{cat.icon}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Quick Assign Section */}
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ClipboardList color={colors.accent} size={20} />
                                <Text style={[styles.sectionTitle, { color: textColor }]}>TAREFAS ATRIBUÍDAS</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/tasks')} style={styles.viewAllBtn}>
                                <Text style={styles.viewAllText}>Ver todas</Text>
                            </TouchableOpacity>
                        </View>

                        {tasks.filter(t => !t.completed).slice(0, 3).map(task => {
                            const cat = getCategoryInfo(task.category);
                            const assignedMember = members.find(m => m.id === task.assignedTo);

                            return (
                                <View key={task.id} style={[styles.taskCard, { backgroundColor: cardColor }]}>
                                    <View style={[styles.taskIcon, { backgroundColor: cat.color + '20' }]}>
                                        <Text style={styles.taskEmoji}>{cat.icon}</Text>
                                    </View>
                                    <View style={styles.taskInfo}>
                                        <Text style={[styles.taskName, { color: textColor }]}>{task.name}</Text>
                                        <View style={styles.taskMeta}>
                                            {assignedMember && (
                                                <View style={styles.assignedBadge}>
                                                    <View style={styles.assignedAvatar}>
                                                        <Text style={styles.assignedAvatarText}>{assignedMember.name.charAt(0)}</Text>
                                                    </View>
                                                    <Text style={[styles.assignedName, { color: mutedColor }]}>{assignedMember.name.split(' ')[0]}</Text>
                                                </View>
                                            )}
                                            <Text style={[styles.taskPoints, { color: colors.accent }]}>+{task.points} pts</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            {/* Member Detail Modal */}
            <Modal visible={showMembersModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>
                                {selectedMember ? selectedMember.name : 'Moradores'}
                            </Text>
                            <TouchableOpacity onPress={() => { setShowMembersModal(false); setSelectedMember(null); }}>
                                <X color={mutedColor} size={24} />
                            </TouchableOpacity>
                        </View>

                        {selectedMember && (
                            <>
                                <View style={[styles.memberProfile, { backgroundColor: bgColor }]}>
                                    <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.profileAvatarText}>{selectedMember.name.charAt(0)}</Text>
                                    </View>
                                    <Text style={[styles.profileName, { color: textColor }]}>{selectedMember.name}</Text>
                                    <Text style={[styles.profileEmail, { color: mutedColor }]}>{selectedMember.email}</Text>
                                    <View style={styles.profileStats}>
                                        <View style={styles.profileStat}>
                                            <Text style={[styles.profileStatValue, { color: textColor }]}>{selectedMember.points}</Text>
                                            <Text style={[styles.profileStatLabel, { color: mutedColor }]}>Pontos</Text>
                                        </View>
                                        <View style={styles.profileStat}>
                                            <Text style={[styles.profileStatValue, { color: textColor }]}>{getMemberStats(selectedMember).total}</Text>
                                            <Text style={[styles.profileStatLabel, { color: mutedColor }]}>Tarefas</Text>
                                        </View>
                                        <View style={styles.profileStat}>
                                            <Text style={[styles.profileStatValue, { color: textColor }]}>{formatJoinDate(selectedMember.joinedAt)}</Text>
                                            <Text style={[styles.profileStatLabel, { color: mutedColor }]}>Membro</Text>
                                        </View>
                                    </View>
                                </View>

                                <Text style={[styles.modalSubtitle, { color: mutedColor }]}>Tarefas Atribuídas</Text>
                                {getMemberTasks(selectedMember.id).map(task => {
                                    const cat = getCategoryInfo(task.category);
                                    return (
                                        <View key={task.id} style={[styles.taskRow, { borderBottomColor: borderColor }]}>
                                            <Text style={styles.taskRowEmoji}>{cat.icon}</Text>
                                            <Text style={[styles.taskRowName, { color: textColor }]}>{task.name}</Text>
                                            <Text style={[styles.taskRowPoints, { color: colors.accent }]}>+{task.points}</Text>
                                        </View>
                                    );
                                })}
                            </>
                        )}

                        {/* Invite Section */}
                        <View style={[styles.inviteSection, { backgroundColor: bgColor }]}>
                            <View style={styles.inviteIcon}><Share2 color={colors.primary} size={24} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inviteTitle, { color: textColor }]}>Convidar Morador</Text>
                                <Text style={[styles.inviteDesc, { color: mutedColor }]}>Compartilhe o código com novos moradores.</Text>
                            </View>
                        </View>
                        <View style={styles.codeDisplay}>
                            <Text style={[styles.codeMain, { color: textColor }]}>{household?.code}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
                                <Text style={styles.copyBtnText}>Copiar Código</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Household Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Criar Minha Casa</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome da Casa</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]}
                            value={householdName}
                            onChangeText={setHouseholdName}
                            placeholder="Ex: Casa da Família"
                            placeholderTextColor={mutedColor}
                        />
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                            if (householdName.trim()) {
                                setHousehold({
                                    name: householdName.trim(),
                                    code: Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
                                    createdAt: Date.now()
                                });
                                setShowCreateModal(false);
                                setHouseholdName('');
                            }
                        }}>
                            <Text style={styles.primaryBtnText}>Criar Casa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Join Household Modal */}
            <Modal visible={showJoinModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Entrar em Casa</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Código da Casa</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]}
                            value={joinCode}
                            onChangeText={setJoinCode}
                            placeholder="Ex: FAM-1234"
                            placeholderTextColor={mutedColor}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                            Alert.alert('Bem-vindo! 🏠', 'Você entrou na casa com sucesso!');
                            setShowJoinModal(false);
                        }}>
                            <Text style={styles.primaryBtnText}>Entrar</Text>
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
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexDirection: 'row', alignItems: 'center' },
    menuButton: { marginRight: spacing.md },
    headerGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
    content: { padding: spacing.lg },

    // Household Card
    householdCard: { backgroundColor: colors.primary, borderRadius: 24, padding: spacing.lg, ...shadows.lg, marginBottom: spacing.lg },
    householdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    householdName: { fontSize: 24, fontWeight: '900', color: colors.white },
    householdCode: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    syncText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: spacing.md },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    shareButton: { position: 'absolute', top: 20, right: 20, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    // Leader Card
    leaderCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, marginBottom: spacing.lg, ...shadows.sm },
    leaderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    leaderEmoji: { fontSize: 24 },
    leaderInfo: { flex: 1 },
    leaderLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    leaderName: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
    leaderPoints: { fontSize: 12, fontWeight: '600', marginTop: 2 },

    // Section Header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
    addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20 },
    addMemberText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    viewAllBtn: { paddingHorizontal: spacing.sm },
    viewAllText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

    // Member Card
    memberCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, marginBottom: spacing.sm, ...shadows.sm },
    memberRank: { width: 24, alignItems: 'center', marginRight: spacing.sm },
    rankNumber: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    rankFirst: { color: colors.accent },
    memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    memberAvatarText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    adminCrown: { position: 'absolute', top: -4, right: -4 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 14, fontWeight: '600' },
    memberMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    memberPoints: { fontSize: 12 },
    memberTasks: { fontSize: 12 },
    memberTasksPreview: { flexDirection: 'row', gap: 4 },
    taskMini: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    taskMiniEmoji: { fontSize: 14 },

    // Task Card
    taskCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, marginBottom: spacing.sm, ...shadows.sm },
    taskIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    taskEmoji: { fontSize: 22 },
    taskInfo: { flex: 1 },
    taskName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    taskMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    assignedAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    assignedAvatarText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
    assignedName: { fontSize: 12 },
    taskPoints: { fontSize: 12, fontWeight: '600' },

    // Empty State
    noGroupState: { alignItems: 'center', padding: 40, borderRadius: 24, marginTop: 20 },
    noGroupTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
    noGroupText: { textAlign: 'center', fontSize: 14, marginBottom: 24, lineHeight: 20 },
    noGroupButtons: { width: '100%', gap: 12 },
    primaryBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
    primaryBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { borderWidth: 2, paddingVertical: 14, borderRadius: 16, alignItems: 'center', width: '100%' },
    secondaryBtnText: { fontWeight: 'bold', fontSize: 16 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },
    inputLabel: { fontSize: 14, marginBottom: 8 },
    modalInput: { padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 16 },

    // Member Profile
    memberProfile: { alignItems: 'center', padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg },
    profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    profileAvatarText: { color: colors.white, fontSize: 28, fontWeight: 'bold' },
    profileName: { fontSize: 20, fontWeight: 'bold' },
    profileEmail: { fontSize: 14, marginTop: 4 },
    profileStats: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl },
    profileStat: { alignItems: 'center' },
    profileStatValue: { fontSize: 18, fontWeight: 'bold' },
    profileStatLabel: { fontSize: 12, marginTop: 2 },

    // Task Row
    taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.md },
    taskRowEmoji: { fontSize: 20 },
    taskRowName: { flex: 1, fontSize: 14 },
    taskRowPoints: { fontSize: 14, fontWeight: '600' },

    // Invite Section
    inviteSection: { flexDirection: 'row', padding: 16, borderRadius: 16, marginTop: spacing.lg, alignItems: 'center', gap: 16 },
    inviteIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
    inviteTitle: { fontSize: 16, fontWeight: 'bold' },
    inviteDesc: { fontSize: 12, marginTop: 2 },
    codeDisplay: { alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginTop: spacing.md },
    codeMain: { fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 16 },
    copyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
    copyBtnText: { color: colors.white, fontWeight: 'bold' },
});
