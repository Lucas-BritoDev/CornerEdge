import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Share, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, Plus, Search, Share2, Trash2, X, Users, DollarSign } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { storageService } from '../services/storage-service';
import { ShoppingList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as Clipboard from 'expo-clipboard';

export default function ListsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListBudget, setNewListBudget] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => { loadLists(); }, []);

    const loadLists = async () => {
        const data = await storageService.getLists();
        setLists(data);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const createList = async () => {
        if (!newListName.trim()) return;
        const budget = newListBudget ? parseFloat(newListBudget.replace(',', '.')) : undefined;
        const newList: ShoppingList = {
            id: Date.now().toString(),
            name: newListName.trim(),
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            budget,
            shareCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        };
        const updatedLists = [newList, ...lists];
        await storageService.saveLists(updatedLists);
        setLists(updatedLists);
        setShowCreateModal(false);
        setNewListName('');
        setNewListBudget('');
        router.push(`/list/${newList.id}`);
    };

    const deleteList = async (id: string) => {
        Alert.alert('Excluir', 'Excluir esta lista?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    const updated = lists.filter(l => l.id !== id);
                    await storageService.saveLists(updated);
                    setLists(updated);
                }
            },
        ]);
    };

    const shareList = async (list: ShoppingList) => {
        const code = list.shareCode || 'XXXXX';
        await Clipboard.setStringAsync(code);
        Alert.alert('Código Copiado!', `Código: ${code}\nCompartilhe com amigos para eles entrarem na lista.`);
    };

    const joinList = async () => {
        if (!joinCode.trim()) return;
        Alert.alert('Em Breve', 'Funcionalidade de entrar em lista compartilhada será implementada com backend.');
        setShowJoinModal(false);
        setJoinCode('');
    };

    const filteredLists = lists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const bgColor = isDark ? '#111827' : colors.background;
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const borderColor = isDark ? '#374151' : colors.border;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}><Menu color={colors.white} size={24} /></TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Minhas Listas</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(true)}><Plus color={colors.white} size={24} /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: cardColor, borderColor }]}>
                        <Search color={mutedColor} size={20} />
                        <TextInput style={[styles.searchInput, { color: textColor }]} placeholder="Buscar listas..." placeholderTextColor={mutedColor} value={searchQuery} onChangeText={setSearchQuery} />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
                        <Plus color={colors.white} size={20} /><Text style={styles.quickActionText}>Nova Lista</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.accent }]} onPress={() => setShowJoinModal(true)}>
                        <Users color={colors.white} size={20} /><Text style={styles.quickActionText}>Entrar com Código</Text>
                    </TouchableOpacity>
                </View>



                {/* Lists */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>{filteredLists.length} listas</Text>
                {filteredLists.map(list => {
                    const progress = list.items.length > 0 ? (list.items.filter(i => i.completed).length / list.items.length) * 100 : 0;
                    const spent = list.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
                    return (
                        <TouchableOpacity key={list.id} style={[styles.listCard, { backgroundColor: cardColor }]} onPress={() => router.push(`/list/${list.id}`)}>
                            <View style={styles.listHeader}>
                                <View style={styles.listEmoji}><Text style={{ fontSize: 24 }}>🛒</Text></View>
                                <View style={styles.listInfo}>
                                    <Text style={[styles.listName, { color: textColor }]}>{list.name}</Text>
                                    <Text style={[styles.listMeta, { color: mutedColor }]}>{list.items.filter(i => i.completed).length}/{list.items.length} itens</Text>
                                </View>
                                <View style={styles.listActions}>
                                    <TouchableOpacity onPress={() => shareList(list)}><Share2 color={colors.primary} size={20} /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteList(list.id)}><Trash2 color={colors.error} size={20} /></TouchableOpacity>
                                </View>
                            </View>
                            {list.budget && (
                                <View style={styles.budgetRow}>
                                    <DollarSign color={spent > list.budget ? colors.error : colors.primary} size={14} />
                                    <Text style={[styles.budgetText, { color: spent > list.budget ? colors.error : colors.primary }]}>R$ {spent.toFixed(2)} / R$ {list.budget.toFixed(2)}</Text>
                                    <View style={[styles.budgetBar, { backgroundColor: borderColor }]}><View style={[styles.budgetFill, { width: `${Math.min((spent / list.budget) * 100, 100)}%`, backgroundColor: spent > list.budget ? colors.error : colors.primary }]} /></View>
                                </View>
                            )}
                            <View style={[styles.progressBar, { backgroundColor: borderColor }]}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                        </TouchableOpacity>
                    );
                })}

                {filteredLists.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Nenhuma lista</Text>
                        <Text style={[styles.emptyText, { color: mutedColor }]}>Crie sua primeira lista de compras</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}><Text style={styles.emptyButtonText}>Criar Lista</Text></TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Create Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: textColor }]}>Nova Lista</Text><TouchableOpacity onPress={() => setShowCreateModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity></View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome da Lista</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={newListName} onChangeText={setNewListName} placeholder="Ex: Compras da Semana" placeholderTextColor={mutedColor} />
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Orçamento (opcional)</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={newListBudget} onChangeText={setNewListBudget} placeholder="Ex: 200.00" placeholderTextColor={mutedColor} keyboardType="decimal-pad" />
                        <TouchableOpacity style={styles.createButton} onPress={createList}><Text style={styles.createButtonText}>Criar Lista</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Join Modal */}
            <Modal visible={showJoinModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: textColor }]}>Entrar na Lista</Text><TouchableOpacity onPress={() => setShowJoinModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity></View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Código da Lista</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={joinCode} onChangeText={setJoinCode} placeholder="Ex: ABC123" placeholderTextColor={mutedColor} autoCapitalize="characters" />
                        <TouchableOpacity style={styles.createButton} onPress={joinList}><Text style={styles.createButtonText}>Entrar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    searchContainer: { padding: spacing.lg, paddingBottom: spacing.md },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.md },
    quickActions: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
    quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
    quickActionText: { color: colors.white, fontWeight: '600' },
    categoriesContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.sm, gap: spacing.xs },
    categoryEmoji: { fontSize: 16 },
    categoryName: { fontSize: fontSize.sm, fontWeight: '500' },
    sectionTitle: { fontSize: fontSize.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    listCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    listEmoji: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    listInfo: { flex: 1 },
    listName: { fontSize: fontSize.md, fontWeight: '600' },
    listMeta: { fontSize: fontSize.sm },
    listActions: { flexDirection: 'row', gap: spacing.md },
    budgetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
    budgetText: { fontSize: fontSize.sm, flex: 1 },
    budgetBar: { width: 80, height: 6, borderRadius: 3, overflow: 'hidden' },
    budgetFill: { height: '100%', borderRadius: 3 },
    progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
    emptyState: { marginHorizontal: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.sm },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs },
    emptyText: { fontSize: fontSize.sm, marginBottom: spacing.md },
    emptyButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
    emptyButtonText: { color: colors.white, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
    modalContent: { borderRadius: borderRadius.lg, padding: spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    inputLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs },
    modalInput: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.md },
    createButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    createButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
