import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, ShoppingList, ShoppingItem } from '../types';
import { storageService } from './storage-service';

export const analyticsService = {
    async trackEvent(eventName: string, params: Record<string, any> = {}) {
        console.log(`[Analytics] ${eventName}`, params);
        // Here we would send to a backend (Supabase/Firebase)
    },

    async updateStats(action: 'create_list' | 'add_item' | 'complete_item' | 'complete_list', count = 1) {
        const profile = await storageService.getProfile();
        if (!profile) return;

        const today = new Date().toISOString().split('T')[0];

        // Update basic stats
        if (action === 'create_list') profile.stats.listsCreated += count;
        if (action === 'add_item') profile.stats.itemsAdded += count;
        if (action === 'complete_item') profile.stats.itemsCompleted += count;
        if (action === 'complete_list') profile.stats.listsCompleted += count;

        // Update streak
        if (profile.stats.lastActiveDate !== today) {
            const lastDate = new Date(profile.stats.lastActiveDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                profile.stats.currentStreak += 1;
            } else if (diffDays > 1) {
                profile.stats.currentStreak = 1;
            }
            profile.stats.lastActiveDate = today;
            profile.stats.daysActive += 1;
        }

        await storageService.saveProfile(profile);
    },

    async getInsights() {
        // Calculate insights for dashboard
        const lists = await storageService.getLists();
        const profile = await storageService.getProfile();

        // Example insights
        const completedLists = lists.filter(l => l.completedAt).length;
        const totalItems = lists.reduce((acc, l) => acc + l.items.length, 0);

        return {
            totalLists: lists.length,
            completedLists,
            completionRate: lists.length > 0 ? (completedLists / lists.length) * 100 : 0,
            totalItems,
            level: profile?.stats.level || 1,
            streak: profile?.stats.currentStreak || 0
        };
    }
};
