import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Search, Clock, Zap, Plus, Heart, X, Check, Trash2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { storageService } from '../services/storage-service';
import { ShoppingList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Recipe {
    id: string;
    name: string;
    time: string;
    calories: string;
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
    ingredients: string[];
    isFavorite?: boolean;
    isCustom?: boolean;
}

const MOCK_RECIPES: Recipe[] = [
    { id: '1', name: 'Strogonoff de Frango', time: '30 min', calories: '350 kcal', difficulty: 'Fácil', ingredients: ['Peito de Frango', 'Creme de Leite', 'Ketchup', 'Mostarda', 'Champignon'] },
    { id: '2', name: 'Arroz de Forno', time: '45 min', calories: '280 kcal', difficulty: 'Médio', ingredients: ['Arroz', 'Frango Desfiado', 'Queijo', 'Milho', 'Ervilha'] },
    { id: '3', name: 'Lasanha Bolonhesa', time: '60 min', calories: '450 kcal', difficulty: 'Médio', ingredients: ['Massa de Lasanha', 'Carne Moída', 'Molho de Tomate', 'Queijo Mussarela', 'Presunto'] },
    { id: '4', name: 'Bolo de Chocolate', time: '50 min', calories: '380 kcal', difficulty: 'Fácil', ingredients: ['Farinha de Trigo', 'Açúcar', 'Ovos', 'Achocolatado', 'Leite', 'Óleo'] },
    { id: '5', name: 'Feijoada', time: '120 min', calories: '550 kcal', difficulty: 'Difícil', ingredients: ['Feijão Preto', 'Costela Suína', 'Linguiça', 'Bacon', 'Paio', 'Couve'] },
    { id: '6', name: 'Macarrão Carbonara', time: '25 min', calories: '420 kcal', difficulty: 'Médio', ingredients: ['Macarrão Espaguete', 'Bacon', 'Ovos', 'Queijo Parmesão', 'Creme de Leite'] },
    { id: '7', name: 'Salada Caesar', time: '15 min', calories: '180 kcal', difficulty: 'Fácil', ingredients: ['Alface', 'Peito de Frango', 'Queijo Parmesão', 'Croutons', 'Molho Caesar'] },
    { id: '8', name: 'Risoto de Camarão', time: '40 min', calories: '400 kcal', difficulty: 'Difícil', ingredients: ['Arroz', 'Camarão', 'Vinho Branco', 'Queijo Parmesão', 'Manteiga'] },
];

const DIFFICULTIES = ['Todas', 'Fácil', 'Médio', 'Difícil'];

export default function RecipesScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('Todas');
    const [showFavorites, setShowFavorites] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showListModal, setShowListModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRecipeName, setNewRecipeName] = useState('');
    const [newRecipeTime, setNewRecipeTime] = useState('');
    const [newRecipeDifficulty, setNewRecipeDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Fácil');
    const [newRecipeIngredients, setNewRecipeIngredients] = useState<string[]>([]);
    const [ingredientInput, setIngredientInput] = useState('');

    useEffect(() => {
        loadFavorites();
        loadLists();
        loadCustomRecipes();
    }, []);

    const loadFavorites = async () => {
        const stored = await AsyncStorage.getItem('@recipe_favorites');
        if (stored) setFavorites(JSON.parse(stored));
    };

    const loadLists = async () => {
        const data = await storageService.getLists();
        setLists(data);
    };

    const loadCustomRecipes = async () => {
        const stored = await AsyncStorage.getItem('@custom_recipes');
        if (stored) setCustomRecipes(JSON.parse(stored));
    };

    const saveCustomRecipes = async (recipes: Recipe[]) => {
        await AsyncStorage.setItem('@custom_recipes', JSON.stringify(recipes));
        setCustomRecipes(recipes);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const toggleFavorite = async (recipeId: string) => {
        const newFavorites = favorites.includes(recipeId)
            ? favorites.filter(id => id !== recipeId)
            : [...favorites, recipeId];
        setFavorites(newFavorites);
        await AsyncStorage.setItem('@recipe_favorites', JSON.stringify(newFavorites));
    };

    const addToList = async (listId: string) => {
        if (!selectedRecipe) return;
        const allLists = await storageService.getLists();
        const updatedLists = allLists.map(list => {
            if (list.id === listId) {
                const newItems = selectedRecipe.ingredients.map((ing, i) => ({
                    id: `${Date.now()}_${i}`,
                    name: ing,
                    category: 'Receita',
                    completed: false,
                    quantity: 1,
                }));
                return { ...list, items: [...list.items, ...newItems], updatedAt: Date.now() };
            }
            return list;
        });
        await storageService.saveLists(updatedLists);
        setShowListModal(false);
        setSelectedRecipe(null);
        Alert.alert('Adicionado!', `Ingredientes de "${selectedRecipe.name}" adicionados à lista.`);
    };

    const openAddToList = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        loadLists();
        setShowListModal(true);
    };

    const addIngredient = () => {
        if (ingredientInput.trim()) {
            setNewRecipeIngredients([...newRecipeIngredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const removeIngredient = (index: number) => {
        setNewRecipeIngredients(newRecipeIngredients.filter((_, i) => i !== index));
    };

    const createRecipe = async () => {
        if (!newRecipeName.trim()) {
            Alert.alert('Erro', 'Digite o nome da receita');
            return;
        }
        if (newRecipeIngredients.length === 0) {
            Alert.alert('Erro', 'Adicione pelo menos um ingrediente');
            return;
        }
        const newRecipe: Recipe = {
            id: `custom_${Date.now()}`,
            name: newRecipeName.trim(),
            time: newRecipeTime || '30 min',
            calories: '-',
            difficulty: newRecipeDifficulty,
            ingredients: newRecipeIngredients,
            isCustom: true,
        };
        await saveCustomRecipes([newRecipe, ...customRecipes]);
        setShowCreateModal(false);
        resetForm();
        Alert.alert('Sucesso!', 'Receita criada com sucesso!');
    };

    const deleteCustomRecipe = (recipeId: string) => {
        Alert.alert('Excluir', 'Excluir esta receita?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    const updated = customRecipes.filter(r => r.id !== recipeId);
                    await saveCustomRecipes(updated);
                }
            }
        ]);
    };

    const resetForm = () => {
        setNewRecipeName('');
        setNewRecipeTime('');
        setNewRecipeDifficulty('Fácil');
        setNewRecipeIngredients([]);
        setIngredientInput('');
    };

    const allRecipes = activeTab === 'all' ? MOCK_RECIPES : customRecipes;
    const filteredRecipes = allRecipes.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === 'Todas' || r.difficulty === difficultyFilter;
        const matchesFavorite = !showFavorites || favorites.includes(r.id);
        return matchesSearch && matchesDifficulty && matchesFavorite;
    });

    const bgColor = isDark ? '#111827' : colors.background;
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const borderColor = isDark ? '#374151' : colors.border;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header with Greeting */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Receitas</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                    <Plus color={colors.white} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
                {/* Tabs */}
                <View style={[styles.tabs, { backgroundColor: cardColor }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                            Receitas ({MOCK_RECIPES.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
                        onPress={() => setActiveTab('custom')}
                    >
                        <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
                            Minhas ({customRecipes.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: cardColor, borderColor }]}>
                        <Search color={mutedColor} size={20} />
                        <TextInput
                            style={[styles.searchInput, { color: textColor }]}
                            placeholder="Buscar receitas..."
                            placeholderTextColor={mutedColor}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                        {DIFFICULTIES.map(d => (
                            <TouchableOpacity
                                key={d}
                                style={[styles.filterChip, { backgroundColor: cardColor, borderColor }, difficultyFilter === d && styles.filterChipActive]}
                                onPress={() => setDifficultyFilter(d)}
                            >
                                <Text style={[styles.filterText, { color: mutedColor }, difficultyFilter === d && styles.filterTextActive]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.filterChip, { backgroundColor: showFavorites ? colors.error : cardColor, borderColor: showFavorites ? colors.error : borderColor }]}
                            onPress={() => setShowFavorites(!showFavorites)}
                        >
                            <Heart color={showFavorites ? colors.white : colors.error} size={16} fill={showFavorites ? colors.white : 'transparent'} />
                            <Text style={[styles.filterText, { color: showFavorites ? colors.white : mutedColor }]}>Favoritos</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Results */}
                <Text style={[styles.resultsCount, { color: mutedColor }]}>{filteredRecipes.length} receitas</Text>

                {activeTab === 'custom' && customRecipes.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Nenhuma receita criada</Text>
                        <Text style={[styles.emptyText, { color: mutedColor }]}>Crie sua primeira receita e ela aparecerá aqui</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
                            <Plus color={colors.white} size={18} />
                            <Text style={styles.emptyButtonText}>Criar Receita</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {filteredRecipes.map(recipe => (
                    <View key={recipe.id} style={[styles.recipeCard, { backgroundColor: cardColor }]}>
                        <View style={styles.recipeHeader}>
                            <View style={styles.recipeEmoji}>
                                <Text style={{ fontSize: 32 }}>{recipe.isCustom ? '👨‍🍳' : '🍲'}</Text>
                            </View>
                            <View style={styles.recipeInfo}>
                                <Text style={[styles.recipeName, { color: textColor }]}>{recipe.name}</Text>
                                <View style={styles.recipeMeta}>
                                    <View style={styles.metaItem}><Clock color={mutedColor} size={14} /><Text style={[styles.metaText, { color: mutedColor }]}>{recipe.time}</Text></View>
                                    <View style={styles.metaItem}><Text style={[styles.metaText, { color: mutedColor }]}>📝 {recipe.ingredients.length} itens</Text></View>
                                    {recipe.calories !== '-' && <View style={styles.metaItem}><Zap color={mutedColor} size={14} /><Text style={[styles.metaText, { color: mutedColor }]}>{recipe.calories}</Text></View>}
                                    <View style={[styles.difficultyBadge, { borderColor: recipe.difficulty === 'Fácil' ? colors.primary : recipe.difficulty === 'Médio' ? colors.warning : colors.error }]}>
                                        <Text style={[styles.difficultyText, { color: recipe.difficulty === 'Fácil' ? colors.primary : recipe.difficulty === 'Médio' ? colors.warning : colors.error }]}>{recipe.difficulty}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.recipeActions}>
                                <TouchableOpacity onPress={() => toggleFavorite(recipe.id)}>
                                    <Heart color={colors.error} size={22} fill={favorites.includes(recipe.id) ? colors.error : 'transparent'} />
                                </TouchableOpacity>
                                {recipe.isCustom && (
                                    <TouchableOpacity onPress={() => deleteCustomRecipe(recipe.id)}>
                                        <Trash2 color={colors.error} size={20} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.ingredientsTags}>
                            {recipe.ingredients.slice(0, 4).map((ing, i) => (
                                <View key={i} style={[styles.ingredientTag, { backgroundColor: isDark ? '#374151' : colors.background }]}><Text style={[styles.ingredientTagText, { color: mutedColor }]}>{ing}</Text></View>
                            ))}
                            {recipe.ingredients.length > 4 && (
                                <View style={[styles.ingredientTag, { backgroundColor: isDark ? '#374151' : colors.background }]}><Text style={[styles.ingredientTagText, { color: mutedColor }]}>+{recipe.ingredients.length - 4}</Text></View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.addToListButton} onPress={() => openAddToList(recipe)}>
                            <Plus color={colors.primary} size={18} />
                            <Text style={styles.addToListText}>Adicionar à Lista</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {/* Select List Modal */}
            <Modal visible={showListModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Selecionar Lista</Text>
                            <TouchableOpacity onPress={() => setShowListModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>
                        {lists.length === 0 ? (
                            <Text style={[styles.noListsText, { color: mutedColor }]}>Nenhuma lista. Crie uma primeiro!</Text>
                        ) : (
                            lists.map(list => (
                                <TouchableOpacity key={list.id} style={[styles.listOption, { borderBottomColor: borderColor }]} onPress={() => addToList(list.id)}>
                                    <Text style={[styles.listOptionText, { color: textColor }]}>{list.name}</Text>
                                    <Text style={[styles.listOptionMeta, { color: mutedColor }]}>{list.items.length} itens</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </Modal>

            {/* Create Recipe Modal */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Nova Receita</Text>
                            <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}><X color={mutedColor} size={24} /></TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome da Receita</Text>
                            <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={newRecipeName} onChangeText={setNewRecipeName} placeholder="Ex: Bolo de Cenoura" placeholderTextColor={mutedColor} />

                            <Text style={[styles.inputLabel, { color: mutedColor }]}>Tempo de Preparo</Text>
                            <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={newRecipeTime} onChangeText={setNewRecipeTime} placeholder="Ex: 45 min" placeholderTextColor={mutedColor} />

                            <Text style={[styles.inputLabel, { color: mutedColor }]}>Dificuldade</Text>
                            <View style={styles.difficultyRow}>
                                {(['Fácil', 'Médio', 'Difícil'] as const).map(d => (
                                    <TouchableOpacity key={d} style={[styles.difficultyOption, newRecipeDifficulty === d && styles.difficultyOptionActive]} onPress={() => setNewRecipeDifficulty(d)}>
                                        <Text style={[styles.difficultyOptionText, newRecipeDifficulty === d && styles.difficultyOptionTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: mutedColor }]}>Ingredientes ({newRecipeIngredients.length})</Text>
                            <View style={styles.ingredientInputRow}>
                                <TextInput style={[styles.ingredientInputField, { backgroundColor: bgColor, color: textColor }]} value={ingredientInput} onChangeText={setIngredientInput} placeholder="Adicionar ingrediente" placeholderTextColor={mutedColor} onSubmitEditing={addIngredient} />
                                <TouchableOpacity style={styles.addIngredientButton} onPress={addIngredient}><Plus color={colors.white} size={20} /></TouchableOpacity>
                            </View>

                            {newRecipeIngredients.map((ing, i) => (
                                <View key={i} style={[styles.ingredientItem, { backgroundColor: bgColor }]}>
                                    <Text style={[styles.ingredientItemText, { color: textColor }]}>{ing}</Text>
                                    <TouchableOpacity onPress={() => removeIngredient(i)}><X color={colors.error} size={18} /></TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity style={styles.createButton} onPress={createRecipe}>
                                <Text style={styles.createButtonText}>Criar Receita</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
    tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.lg, padding: spacing.xs, ...shadows.sm },
    tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
    tabTextActive: { color: colors.white },
    searchContainer: { padding: spacing.lg, paddingBottom: spacing.md },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.md },
    filtersRow: { marginBottom: spacing.md },
    filtersContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.sm, gap: 4 },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: fontSize.sm },
    filterTextActive: { color: colors.white, fontWeight: '600' },
    resultsCount: { paddingHorizontal: spacing.lg, fontSize: fontSize.sm, marginBottom: spacing.md },
    emptyState: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', ...shadows.sm },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs },
    emptyText: { fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
    emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, gap: spacing.xs },
    emptyButtonText: { color: colors.white, fontWeight: '600' },
    recipeCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
    recipeHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    recipeEmoji: { width: 56, height: 56, borderRadius: borderRadius.lg, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    recipeInfo: { flex: 1 },
    recipeName: { fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: 4 },
    recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: fontSize.sm },
    recipeActions: { gap: spacing.sm },
    difficultyBadge: { borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
    difficultyText: { fontSize: fontSize.xs, fontWeight: '600' },
    ingredientsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.md },
    ingredientTag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    ingredientTagText: { fontSize: fontSize.sm },
    addToListButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
    addToListText: { color: colors.primary, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: colors.background },
    modalContent: { flex: 1, padding: spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    noListsText: { textAlign: 'center', paddingVertical: spacing.xl },
    listOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
    listOptionText: { fontSize: fontSize.md, fontWeight: '500' },
    listOptionMeta: { fontSize: fontSize.sm },
    inputLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
    modalInput: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md },
    difficultyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    difficultyOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    difficultyOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    difficultyOptionText: { color: colors.textMuted },
    difficultyOptionTextActive: { color: colors.white, fontWeight: '600' },
    ingredientInputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    ingredientInputField: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md },
    addIngredientButton: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ingredientItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.xs },
    ingredientItemText: { flex: 1 },
    createButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.lg },
    createButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
