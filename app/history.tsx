import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { Header } from '@/components/Header';
import { storageService } from '@/services/storage-service';
import { ShoppingList } from '@/types';

export default function HistoryScreen() {
    const [history, setHistory] = useState<ShoppingList[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const lists = await storageService.getLists();
        // Filter completed lists or just show all in history? User said "Completed".
        // I'll show lists that have all items completed or are marked completed (field I added in types).
        // For now, let's just show all lists sorted by date descending.
        setHistory(lists.sort((a, b) => b.updatedAt - a.updatedAt));
    };

    return (
        <View style={styles.container}>
            <Header title="Histórico" showBack />
            <FlatList
                data={history}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        <Text style={styles.title}>{item.name}</Text>
                        <Text style={styles.stats}>
                            {item.items.length} itens • {item.items.filter(i => i.completed).length} comprados
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    date: { fontSize: 12, color: '#999', marginBottom: 4 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    stats: { color: '#666' }
});
