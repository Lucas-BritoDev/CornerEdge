import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, HouseholdTask, Household } from '../types';
import { storageService } from './storage-service';

export const analyticsService = {
    async trackEvent(eventName: string, params: Record<string, any> = {}) {
        console.log(`[Analytics] ${eventName}`, params);
        // Here we would send to a backend (Supabase/Firebase)
    },

    async updateStats(action: 'create_task' | 'complete_task', count = 1) {
        const profile = await storageService.getProfile();
        if (!profile) return;

        const today = new Date().toISOString().split('T')[0];

        // Update basic stats
        if (action === 'create_task') profile.stats.tasksCreated += count;
        if (action === 'complete_task') {
            profile.stats.tasksCompleted += count;
        }

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
        const household = await storageService.getHousehold();
        const profile = await storageService.getProfile();

        const tasks = household?.tasks || [];
        const completedTasks = tasks.filter((t: HouseholdTask) => t.completed).length;
        const totalTasks = tasks.length;

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            pendingTasks: totalTasks - completedTasks,
            level: profile?.stats.level || 1,
            streak: profile?.stats.currentStreak || 0,
            totalPoints: profile?.stats.totalPoints || 0
        };
    }
};
