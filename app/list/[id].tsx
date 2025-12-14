import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Share,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Keyboard,
    Dimensions,
    SectionList,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingList, ShoppingItem } from '@/types';
import { storageService } from '@/services/storage-service';
import { gamificationService } from '@/services/gamification-service';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { CATEGORIES, getProductsByCategory, searchProducts, ProductSuggestion } from '@/data/products';
import { Menu, Share2, Plus, Check, Trash2, DollarSign, X, ChevronDown, ChevronRight, Edit2 } from 'lucide-react-native';
import { DrawerMenu } from '../../components/DrawerMenu';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CategorySection {
    title: string;
    id: string;
    icon: string;
    color: string;
    data: ShoppingItem[];
}

export default function ListDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const sectionListRef = useRef<SectionList>(null);

    // State
    const [menuOpen, setMenuOpen] = useState(false);
    const [list, setList] = useState<ShoppingList | null>(null);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<(ProductSuggestion & { categoryId: string })[]>([]);

    // UI State
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeCategoryInModal, setActiveCategoryInModal] = useState<string | null>(null); // For sub-selection

    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

    useEffect(() => { loadList(); }, [id]);

    const loadList = async () => {
        const allLists = await storageService.getLists();
        const currentList = allLists.find(l => l.id === id);
        if (currentList) {
            setList(currentList);
            setItems(currentList.items);
        }
        setLoading(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const saveList = async (updatedItems: ShoppingItem[]) => {
        if (!list) return;
        const allLists = await storageService.getLists();
        const updatedLists = allLists.map(l =>
            l.id === list.id ? { ...l, items: updatedItems, updatedAt: Date.now() } : l
        );
        await storageService.saveLists(updatedLists);
        setItems(updatedItems);
    };

    const addItem = async (name?: string, categoryId?: string) => {
        const itemToAdd = name || itemName.trim();
        if (!itemToAdd) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const price = itemPrice ? parseFloat(itemPrice.replace(',', '.')) : undefined;
        // Logic to determine category: Argument > Selected State > Default 'Outros'
        const cat = categoryId || selectedCategory || 'outros';

        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            name: itemToAdd,
            category: cat,
            completed: false,
            quantity: 1,
            price,
        };
        const newItems = [...items, newItem];
        await saveList(newItems);

        // Gamification
        await gamificationService.addXP(5);
        await gamificationService.updateChallengeProgress('add_item');

        // Reset Inputs
        setItemName('');
        setItemPrice('');
        setSuggestions([]);
        // Keep selected category if desired? No, reset for fresh start usually, or keep if batch adding.
        // User requested easy adding, so keeping it might be annoying if they change context. Resetting.
        // setSelectedCategory(null); 
        Keyboard.dismiss();
    };

    const toggleItem = async (itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newItems = items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
        await saveList(newItems);
        const item = newItems.find(i => i.id === itemId);
        if (item?.completed) {
            gamificationService.addXP(2);
            gamificationService.updateChallengeProgress('check_item');
        }
        if (newItems.length > 0 && newItems.every(i => i.completed)) {
            Alert.alert("🎉 Lista Completa!", "+50 XP");
            gamificationService.addXP(50);
            gamificationService.updateChallengeProgress('complete_list');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const deleteItem = async (itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newItems = items.filter(i => i.id !== itemId);
        await saveList(newItems);
    };

    const updateItemPrice = async (itemId: string) => {
        const price = tempPrice ? parseFloat(tempPrice.replace(',', '.')) : undefined;
        const newItems = items.map(i => i.id === itemId ? { ...i, price } : i);
        await saveList(newItems);
        setEditingPriceId(null);
        setTempPrice('');
    };

    const handleShare = async () => {
        if (!list) return;
        const grouped = groupItems(items);
        let text = `${list.name}\n\n`;
        grouped.forEach(section => {
            text += `*${section.title}*\n`;
            section.data.forEach(i => {
                text += `${i.completed ? '✅' : '⬜'} ${i.name} (${i.quantity})${i.price ? ` - R$ ${i.price.toFixed(2)}` : ''}\n`;
            });
            text += '\n';
        });
        await Share.share({ message: text });
    };

    const updateSuggestions = (text: string) => {
        setItemName(text);
        if (text.length > 1) {
            const results = searchProducts(text).slice(0, 5);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = (suggestion: ProductSuggestion & { categoryId: string }) => {
        addItem(suggestion.name, suggestion.categoryId);
    };

    // --- Refactored Grouping ---
    const groupItems = (ListItems: ShoppingItem[]): CategorySection[] => {
        const groups: { [key: string]: ShoppingItem[] } = {};

        ListItems.forEach(item => {
            let catId = item.category || 'outros';
            // Validation: if category not in DB, force 'outros'
            if (!CATEGORIES.find(c => c.id === catId)) {
                catId = 'outros';
            }
            if (!groups[catId]) groups[catId] = [];
            groups[catId].push(item);
        });

        const sections: CategorySection[] = Object.keys(groups).map(catId => {
            const categoryDef = CATEGORIES.find(c => c.id === catId);
            return {
                title: categoryDef?.name || 'Outros',
                id: catId,
                icon: categoryDef?.icon || '📦',
                color: categoryDef?.color || '#94A3B8',
                data: groups[catId].sort((a, b) => Number(a.completed) - Number(b.completed))
            };
        }).sort((a, b) => {
            if (a.id === 'outros') return 1;
            if (b.id === 'outros') return -1;
            return a.title.localeCompare(b.title);
        });

        return sections;
    };

    const sections = groupItems(items);
    const totalSpent = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
    const budgetProgress = list?.budget ? (totalSpent / list.budget) * 100 : 0;
    const isOverBudget = list?.budget && totalSpent > list.budget;
    const completedCount = items.filter(i => i.completed).length;

    const toggleSection = (sectionId: string) => {
        Haptics.selectionAsync();
        setCollapsedSections(prev =>
            prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
        );
    };

    // Styling Vars
    const bgColor = isDark ? '#111827' : colors.background;
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const borderColor = isDark ? '#374151' : colors.border;
    const inputBg = isDark ? '#374151' : '#F3F4F6';

    const renderRightActions = (itemId: string, progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });
        return (
            <TouchableOpacity style={styles.deleteAction} onPress={() => deleteItem(itemId)}>
                <Animated.View style={{ transform: [{ scale: trans }] }}>
                    <Trash2 color="white" size={24} />
                </Animated.View>
            </TouchableOpacity>
        );
    };

    if (loading || !list) {
        return <View style={[styles.container, styles.centered, { backgroundColor: bgColor }]}><Text style={{ color: textColor }}>Carregando...</Text></View>;
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: bgColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>{list.name}</Text>
                    <Text style={styles.headerSubtitle}>{completedCount}/{items.length} itens</Text>
                </View>
                <TouchableOpacity onPress={handleShare}><Share2 color={colors.white} size={22} /></TouchableOpacity>
            </View>

            {/* Budget Bar */}
            {list.budget && (
                <View style={[styles.budgetSection, { backgroundColor: cardColor }]}>
                    <View style={styles.budgetHeader}>
                        <DollarSign color={isOverBudget ? colors.error : colors.primary} size={18} />
                        <Text style={[styles.budgetText, { color: isOverBudget ? colors.error : colors.primary }]}>
                            R$ {totalSpent.toFixed(2)} / R$ {(list.budget || 0).toFixed(2)}
                        </Text>
                        <Text style={[styles.budgetRemaining, { color: isOverBudget ? colors.error : mutedColor }]}>
                            {isOverBudget ? `Excedido R$ ${(totalSpent - (list?.budget || 0)).toFixed(2)}` : `Restam R$ ${((list?.budget || 0) - totalSpent).toFixed(2)}`}
                        </Text>
                    </View>
                    <View style={[styles.budgetBar, { backgroundColor: borderColor }]}>
                        <View style={[styles.budgetFill, { width: `${Math.min(budgetProgress, 100)}%`, backgroundColor: isOverBudget ? colors.error : colors.primary }]} />
                    </View>
                </View>
            )}

            {/* List Content */}
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                ref={sectionListRef}
                style={styles.itemsList}
                contentContainerStyle={{ paddingBottom: 350, paddingHorizontal: spacing.md }}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section }) => (
                    <TouchableOpacity
                        style={[styles.sectionHeader, { backgroundColor: bgColor }]}
                        onPress={() => toggleSection(section.id)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.sectionBadge, { backgroundColor: section.color + '20' }]}>
                            <Text style={styles.sectionIcon}>{section.icon}</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>{section.title}</Text>
                        <View style={styles.sectionLine} />
                        {collapsedSections.includes(section.id) ?
                            <ChevronDown color={mutedColor} size={20} /> :
                            <ChevronDown color={mutedColor} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                        }
                    </TouchableOpacity>
                )}
                renderItem={({ item, section }) => {
                    if (collapsedSections.includes(section.id)) return null;
                    return (
                        <Swipeable renderRightActions={(progress, dragX) => renderRightActions(item.id, progress, dragX)}>
                            <View style={[styles.itemCard, { backgroundColor: cardColor }]}>
                                <TouchableOpacity style={[styles.checkbox, item.completed && styles.checkboxChecked]} onPress={() => toggleItem(item.id)}>
                                    {item.completed && <Check color={colors.white} size={14} />}
                                </TouchableOpacity>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemName, item.completed && styles.itemNameCompleted, { color: item.completed ? mutedColor : textColor }]}>{item.name}</Text>
                                    <Text style={[styles.itemMeta, { color: mutedColor }]}>Qtd: {item.quantity}</Text>
                                </View>

                                {editingPriceId === item.id ? (
                                    <View style={styles.priceEdit}>
                                        <TextInput
                                            style={[styles.priceInput, { borderBottomColor: colors.primary, color: textColor }]}
                                            value={tempPrice}
                                            onChangeText={setTempPrice}
                                            placeholder="0.00"
                                            placeholderTextColor={mutedColor}
                                            keyboardType="decimal-pad"
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={() => updateItemPrice(item.id)}><Check color={colors.primary} size={18} /></TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.priceButton} onPress={() => { setEditingPriceId(item.id); setTempPrice(item.price?.toString() || ''); }}>
                                        <Text style={styles.priceText}>{item.price ? `R$ ${item.price.toFixed(2)}` : 'Preço'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Swipeable>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🛒</Text>
                        <Text style={[styles.emptyText, { color: textColor }]}>Sua lista está vazia</Text>
                        <Text style={{ color: mutedColor }}>Adicione itens abaixo</Text>
                    </View>
                }
            />

            {/* Input & Suggestions Bottom Sheet */}
            <View style={[styles.bottomContainer, { backgroundColor: cardColor, borderTopColor: borderColor, paddingBottom: insets.bottom }]}>
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {suggestions.map((s, i) => (
                                <TouchableOpacity key={i} style={[styles.suggestionChip, { backgroundColor: inputBg }]} onPress={() => selectSuggestion(s)}>
                                    <Text style={styles.suggestionIcon}>{CATEGORIES.find(c => c.id === s.categoryId)?.icon}</Text>
                                    <Text style={[styles.suggestionText, { color: textColor }]}>{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.inputRow}>
                    <TouchableOpacity
                        style={[styles.catSelectButton, { backgroundColor: inputBg }]}
                        onPress={() => { setShowCategoryModal(true); setActiveCategoryInModal(null); }}
                    >
                        <Text style={{ fontSize: 18 }}>
                            {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.icon : '📦'}
                        </Text>
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.mainInput, { backgroundColor: inputBg, color: textColor }]}
                        placeholder="Adicionar item..."
                        placeholderTextColor={mutedColor}
                        value={itemName}
                        onChangeText={updateSuggestions}
                        onSubmitEditing={() => addItem()}
                    />

                    <TextInput
                        style={[styles.priceInputBar, { backgroundColor: inputBg, color: textColor }]}
                        placeholder="R$"
                        placeholderTextColor={mutedColor}
                        value={itemPrice}
                        onChangeText={setItemPrice}
                        keyboardType="decimal-pad"
                    />

                    <TouchableOpacity style={styles.addButton} onPress={() => addItem()}>
                        <Plus color={colors.white} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Smart Category Modal */}
            <Modal visible={showCategoryModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}>
                            {activeCategoryInModal ? (
                                <TouchableOpacity onPress={() => setActiveCategoryInModal(null)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ChevronDown style={{ transform: [{ rotate: '90deg' }] }} color={textColor} size={24} />
                                    <Text style={[styles.modalTitle, { color: textColor, marginLeft: 8 }]}>
                                        {CATEGORIES.find(c => c.id === activeCategoryInModal)?.name}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={[styles.modalTitle, { color: textColor }]}>Escolher Categoria</Text>
                            )}
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>

                        {/* If Category Selected: Show Items */}
                        {activeCategoryInModal ? (
                            <ScrollView contentContainerStyle={styles.quickItemsGrid}>
                                {getProductsByCategory(activeCategoryInModal).map((prod, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.quickItemChip, { backgroundColor: inputBg }]}
                                        onPress={() => {
                                            addItem(prod.name, activeCategoryInModal);
                                            // Optional: close modal or stay? User said "justamente pra facilitar"
                                            // I'll keep it open for multiple adds, maybe close on outside click.
                                            // Actually, instant feedback is better.
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        }}
                                    >
                                        <Plus size={14} color={mutedColor} style={{ marginRight: 4 }} />
                                        <Text style={{ color: textColor }}>{prod.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        ) : (
                            <ScrollView contentContainerStyle={styles.categoryGrid}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoryCard, { backgroundColor: cat.color + '15', borderColor: selectedCategory === cat.id ? cat.color : 'transparent', borderWidth: 1 }]}
                                        onPress={() => {
                                            // If just selecting for input:
                                            setSelectedCategory(cat.id);
                                            // But now we want to show items:
                                            setActiveCategoryInModal(cat.id);
                                        }}
                                    >
                                        <Text style={styles.categoryCardIcon}>{cat.icon}</Text>
                                        <Text style={[styles.categoryCardName, { color: textColor }]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    menuButton: { padding: spacing.sm, marginRight: spacing.md },
    headerContent: { flex: 1 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    headerTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },

    budgetSection: { padding: spacing.md, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
    budgetText: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },
    budgetRemaining: { fontSize: fontSize.sm },
    budgetBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    budgetFill: { height: '100%', borderRadius: 4 },

    itemsList: { flex: 1, marginTop: spacing.sm },

    // Section Headers
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
    sectionBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: fontSize.md, fontWeight: 'bold', marginRight: spacing.sm },
    sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginRight: spacing.sm },

    itemCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', ...shadows.sm },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    itemContent: { flex: 1 },
    itemName: { fontSize: fontSize.md, fontWeight: '500' },
    itemNameCompleted: { textDecorationLine: 'line-through' },
    itemMeta: { fontSize: fontSize.sm },
    priceButton: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, marginRight: spacing.sm },
    priceText: { fontSize: fontSize.sm, color: colors.primary },
    priceEdit: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm, gap: spacing.xs },
    priceInput: { width: 60, borderBottomWidth: 1, fontSize: fontSize.sm, padding: 2 },

    // Swipe Action
    deleteAction: { backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: borderRadius.md, marginBottom: spacing.sm, marginLeft: spacing.sm },

    emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.lg, fontWeight: '600' },

    // Bottom Input Area
    bottomContainer: { borderTopWidth: 1, ...shadows.lg },
    suggestionsContainer: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    suggestionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: borderRadius.full, marginRight: spacing.sm, gap: 6 },
    suggestionIcon: { fontSize: 14 },
    suggestionText: { fontSize: fontSize.sm, fontWeight: '500' },

    inputRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
    catSelectButton: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    mainInput: { flex: 1, height: 48, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md },
    priceInputBar: { width: 70, height: 48, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, fontSize: fontSize.md, textAlign: 'center' },
    addButton: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    categoryCard: { width: '31%', padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.sm },
    categoryCardIcon: { fontSize: 32, marginBottom: spacing.xs },
    categoryCardName: { fontSize: fontSize.xs, textAlign: 'center', fontWeight: '500' },

    // Quick Items Grid in Modal
    quickItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    quickItemChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 4 }
});
