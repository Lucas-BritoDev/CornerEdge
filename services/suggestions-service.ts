import { ShoppingItem } from '../types';

const COMMON_ITEMS: Partial<ShoppingItem>[] = [
    { name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg' },
    { name: 'Feijão', category: 'Alimentos', quantity: 1, unit: 'kg' },
    { name: 'Leite', category: 'Laticínios', quantity: 1, unit: 'l' },
    { name: 'Pão', category: 'Padaria', quantity: 1, unit: 'un' },
    { name: 'Ovos', category: 'Alimentos', quantity: 12, unit: 'un' },
    { name: 'Banana', category: 'Hortifruti', quantity: 1, unit: 'dz' },
    { name: 'Maçã', category: 'Hortifruti', quantity: 1, unit: 'kg' },
    { name: 'Café', category: 'Alimentos', quantity: 500, unit: 'g' },
    { name: 'Açúcar', category: 'Alimentos', quantity: 1, unit: 'kg' },
    { name: 'Óleo', category: 'Alimentos', quantity: 1, unit: 'l' },
];

export const suggestionsService = {
    getSuggestions(query: string): Partial<ShoppingItem>[] {
        if (!query) return [];

        return COMMON_ITEMS.filter(item =>
            item.name?.toLowerCase().includes(query.toLowerCase())
        );
    },

    async getSmartSuggestions(historyItems: ShoppingItem[]): Promise<Partial<ShoppingItem>[]> {
        // Simple "ML": suggest items bought frequently but not recently? 
        // For now just return common items as "Trending"
        return COMMON_ITEMS.slice(0, 5);
    }
};
