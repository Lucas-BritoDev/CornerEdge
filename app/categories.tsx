import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Header } from '@/components/Header';
import { Plus, X } from 'lucide-react-native';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentos', color: '#EF4444' },
    { id: '2', name: 'Bebidas', color: '#3B82F6' },
    { id: '3', name: 'Higiene', color: '#10B981' },
    { id: '4', name: 'Limpeza', color: '#F59E0B' },
    { id: '5', name: 'Outros', color: '#6B7280' },
];

export default function CategoriesScreen() {
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [newCat, setNewCat] = useState('');

    const addCategory = () => {
        if (!newCat.trim()) return;
        setCategories([...categories, { id: Date.now().toString(), name: newCat, color: '#888' }]);
        setNewCat('');
    };

    const removeCategory = (id: string) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    return (
        <View style={styles.container}>
            <Header title="Categorias" showBack />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Nova Categoria"
                    value={newCat}
                    onChangeText={setNewCat}
                />
                <TouchableOpacity style={styles.addButton} onPress={addCategory}>
                    <Plus color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                        <Text style={styles.name}>{item.name}</Text>
                        {['1', '2', '3', '4', '5'].includes(item.id) ? null : ( // Can't delete defaults
                            <TouchableOpacity onPress={() => removeCategory(item.id)}>
                                <X color="#999" size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff' },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginRight: 10 },
    addButton: { width: 44, height: 44, backgroundColor: '#8b5cf6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    name: { flex: 1, fontSize: 16, fontWeight: '500' }
});
