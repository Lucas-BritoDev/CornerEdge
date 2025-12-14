import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from './storage-service';
import { Achievement } from '../types';

// 10 Níveis do Sistema
export const LEVELS = [
    { level: 1, name: 'Iniciante', xpRequired: 0, icon: '🌱' },
    { level: 2, name: 'Explorador', xpRequired: 100, icon: '🔍' },
    { level: 3, name: 'Comprador', xpRequired: 250, icon: '🛒' },
    { level: 4, name: 'Economizador', xpRequired: 500, icon: '💰' },
    { level: 5, name: 'Expert', xpRequired: 1000, icon: '⭐' },
    { level: 6, name: 'Mestre', xpRequired: 2000, icon: '🏅' },
    { level: 7, name: 'Campeão', xpRequired: 3500, icon: '🏆' },
    { level: 8, name: 'Lenda', xpRequired: 5500, icon: '👑' },
    { level: 9, name: 'Guru', xpRequired: 8000, icon: '🧙' },
    { level: 10, name: 'Supremo', xpRequired: 12000, icon: '💎' },
];

// 24 Conquistas organizadas por categoria
export const ACHIEVEMENTS: Achievement[] = [
    // BRONZE (6 conquistas)
    { id: 'first_list', title: 'Primeira Lista', description: 'Crie sua primeira lista de compras', category: 'bronze', xpReward: 25, condition: () => true, icon: '📝' },
    { id: 'first_item', title: 'Primeiro Item', description: 'Adicione seu primeiro item', category: 'bronze', xpReward: 10, condition: () => true, icon: '🍎' },
    { id: 'complete_list', title: 'Missão Cumprida', description: 'Complete uma lista de compras', category: 'bronze', xpReward: 50, condition: () => true, icon: '✅' },
    { id: 'add_10_items', title: 'Comprador Iniciante', description: 'Adicione 10 itens no total', category: 'bronze', xpReward: 30, condition: () => true, icon: '🛍️' },
    { id: 'first_streak', title: 'Primeiro Streak', description: 'Use o app por 2 dias seguidos', category: 'bronze', xpReward: 40, condition: () => true, icon: '⚡' },
    { id: 'first_recipe', title: 'Chef Iniciante', description: 'Adicione itens de uma receita', category: 'bronze', xpReward: 35, condition: () => true, icon: '👨‍🍳' },

    // SILVER (6 conquistas)
    { id: 'create_5_lists', title: 'Organizador', description: 'Crie 5 listas de compras', category: 'silver', xpReward: 75, condition: () => true, icon: '📋' },
    { id: 'complete_5_lists', title: 'Eficiente', description: 'Complete 5 listas', category: 'silver', xpReward: 100, condition: () => true, icon: '✨' },
    { id: 'add_50_items', title: 'Comprador Regular', description: 'Adicione 50 itens no total', category: 'silver', xpReward: 80, condition: () => true, icon: '🛒' },
    { id: 'streak_7', title: 'Uma Semana', description: 'Mantenha um streak de 7 dias', category: 'silver', xpReward: 120, condition: () => true, icon: '🗓️' },
    { id: 'share_list', title: 'Compartilhador', description: 'Compartilhe uma lista', category: 'silver', xpReward: 60, condition: () => true, icon: '🤝' },
    { id: 'level_5', title: 'Expert', description: 'Alcance o nível 5', category: 'silver', xpReward: 150, condition: () => true, icon: '⭐' },

    // GOLD (6 conquistas)
    { id: 'create_20_lists', title: 'Mestre Organizador', description: 'Crie 20 listas de compras', category: 'gold', xpReward: 200, condition: () => true, icon: '📚' },
    { id: 'complete_20_lists', title: 'Super Eficiente', description: 'Complete 20 listas', category: 'gold', xpReward: 250, condition: () => true, icon: '🚀' },
    { id: 'add_200_items', title: 'Comprador Frequente', description: 'Adicione 200 itens no total', category: 'gold', xpReward: 180, condition: () => true, icon: '🏢' },
    { id: 'streak_30', title: 'Um Mês', description: 'Mantenha um streak de 30 dias', category: 'gold', xpReward: 300, condition: () => true, icon: '📅' },
    { id: 'save_money', title: 'Economista', description: 'Economize R$100 em compras', category: 'gold', xpReward: 220, condition: () => true, icon: '💰' },
    { id: 'level_8', title: 'Lenda', description: 'Alcance o nível 8', category: 'gold', xpReward: 280, condition: () => true, icon: '👑' },

    // PLATINUM (6 conquistas)
    { id: 'create_50_lists', title: 'Guru das Compras', description: 'Crie 50 listas de compras', category: 'platinum', xpReward: 400, condition: () => true, icon: '🕍' },
    { id: 'complete_50_lists', title: 'Perfecionista', description: 'Complete 50 listas', category: 'platinum', xpReward: 500, condition: () => true, icon: '🎯' },
    { id: 'add_500_items', title: 'Comprador Supremo', description: 'Adicione 500 itens no total', category: 'platinum', xpReward: 350, condition: () => true, icon: '🏗️' },
    { id: 'streak_100', title: 'Centenário', description: 'Mantenha um streak de 100 dias', category: 'platinum', xpReward: 600, condition: () => true, icon: '💯' },
    { id: 'all_challenges', title: 'Desafiador', description: 'Complete 50 desafios', category: 'platinum', xpReward: 450, condition: () => true, icon: '⚔️' },
    { id: 'level_10', title: 'Supremo', description: 'Alcance o nível máximo', category: 'platinum', xpReward: 1000, condition: () => true, icon: '💎' },
];

// Tipos de Desafios
export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly';
    xpReward: number;
    target: number;
    progress: number;
    completed: boolean;
    expiresAt: number;
}

// Gerar desafios
export const generateDailyChallenges = (): Challenge[] => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return [
        {
            id: `daily_add_5_${now}`,
            title: 'Adicione 5 Itens',
            description: 'Adicione 5 itens a qualquer lista',
            type: 'daily',
            xpReward: 20,
            target: 5,
            progress: 0,
            completed: false,
            expiresAt: endOfDay.getTime(),
        },
        {
            id: `daily_complete_${now}`,
            title: 'Complete uma Lista',
            description: 'Marque todos os itens de uma lista',
            type: 'daily',
            xpReward: 30,
            target: 1,
            progress: 0,
            completed: false,
            expiresAt: endOfDay.getTime(),
        },
        {
            id: `daily_check_${now}`,
            title: 'Marque 10 Itens',
            description: 'Marque 10 itens como comprados',
            type: 'daily',
            xpReward: 25,
            target: 10,
            progress: 0,
            completed: false,
            expiresAt: endOfDay.getTime(),
        },
    ];
};

export const generateWeeklyChallenges = (): Challenge[] => {
    const now = Date.now();
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    return [
        {
            id: `weekly_lists_${now}`,
            title: 'Crie 3 Listas',
            description: 'Crie 3 novas listas esta semana',
            type: 'weekly',
            xpReward: 75,
            target: 3,
            progress: 0,
            completed: false,
            expiresAt: endOfWeek.getTime(),
        },
        {
            id: `weekly_items_${now}`,
            title: 'Adicione 30 Itens',
            description: 'Adicione 30 itens esta semana',
            type: 'weekly',
            xpReward: 100,
            target: 30,
            progress: 0,
            completed: false,
            expiresAt: endOfWeek.getTime(),
        },
    ];
};

export const generateMonthlyChallenges = (): Challenge[] => {
    const now = Date.now();
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return [
        {
            id: `monthly_streak_${now}`,
            title: 'Streak de 15 Dias',
            description: 'Mantenha um streak de 15 dias este mês',
            type: 'monthly',
            xpReward: 200,
            target: 15,
            progress: 0,
            completed: false,
            expiresAt: endOfMonth.getTime(),
        },
        {
            id: `monthly_complete_${now}`,
            title: 'Complete 10 Listas',
            description: 'Complete 10 listas este mês',
            type: 'monthly',
            xpReward: 250,
            target: 10,
            progress: 0,
            completed: false,
            expiresAt: endOfMonth.getTime(),
        },
    ];
};

export const gamificationService = {
    async getLevelInfo(currentXP: number) {
        let currentLevelInfo = LEVELS[0];
        let nextLevelInfo = LEVELS[1];

        // Find current level based on XP
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (currentXP >= LEVELS[i].xpRequired) {
                currentLevelInfo = LEVELS[i];
                nextLevelInfo = LEVELS[i + 1] || { ...LEVELS[i], xpRequired: LEVELS[i].xpRequired * 2 }; // Fallback for max level
                break;
            }
        }

        const xpForCurrentLevel = currentLevelInfo.xpRequired;
        const xpForNextLevel = nextLevelInfo.xpRequired;
        const xpInCurrentLevel = currentXP - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

        // Prevent division by zero or weird states at max level
        const progress = xpNeededForNext > 0 ? Math.min(Math.max(xpInCurrentLevel / xpNeededForNext, 0), 1) : 1;
        const xpToNext = Math.max(xpForNextLevel - currentXP, 0);

        return {
            currentLevel: currentLevelInfo.level,
            currentTitle: currentLevelInfo.name,
            currentIcon: currentLevelInfo.icon,
            xpToNext,
            progress
        };
    },

    async addXP(amount: number): Promise<{ newXP: number; levelUp: boolean; newLevel: number }> {
        const profile = await storageService.getProfile();
        if (!profile) return { newXP: 0, levelUp: false, newLevel: 1 };

        const oldXP = profile.stats.xp || 0;
        const newXP = oldXP + amount;
        const oldLevel = profile.stats.level || 1;
        const newLevel = this.calculateLevel(newXP);
        const levelUp = newLevel > oldLevel;

        profile.stats.xp = newXP;
        profile.stats.level = newLevel;
        await storageService.saveProfile(profile);

        return { newXP, levelUp, newLevel };
    },

    calculateLevel(xp: number): number {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xpRequired) {
                return LEVELS[i].level;
            }
        }
        return 1;
    },

    async updateStreak(): Promise<{ streak: number; isNewDay: boolean }> {
        const profile = await storageService.getProfile();
        if (!profile) return { streak: 0, isNewDay: false };

        const today = new Date().toDateString();
        const lastActive = profile.stats.lastActiveDate;

        if (lastActive === today) {
            return { streak: profile.stats.currentStreak, isNewDay: false };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastActive === yesterday.toDateString();

        let newStreak = wasYesterday ? profile.stats.currentStreak + 1 : 1;

        profile.stats.currentStreak = newStreak;
        profile.stats.lastActiveDate = today;
        profile.stats.daysActive = (profile.stats.daysActive || 0) + 1;
        await storageService.saveProfile(profile);

        // XP bonus for streaks
        if (newStreak === 7) await this.addXP(50);
        else if (newStreak === 30) await this.addXP(150);
        else if (newStreak === 100) await this.addXP(500);
        else await this.addXP(5); // Daily login bonus

        return { streak: newStreak, isNewDay: true };
    },

    async checkAchievements(): Promise<Achievement[]> {
        const profile = await storageService.getProfile();
        if (!profile) return [];

        const unlockedNow: Achievement[] = [];
        const stats = profile.stats;

        // Check each achievement
        for (const achievement of ACHIEVEMENTS) {
            if (profile.achievements.includes(achievement.id)) continue;

            let unlocked = false;
            switch (achievement.id) {
                case 'first_list':
                    unlocked = stats.listsCreated >= 1;
                    break;
                case 'first_item':
                    unlocked = stats.itemsAdded >= 1;
                    break;
                case 'complete_list':
                    unlocked = stats.listsCompleted >= 1;
                    break;
                case 'add_10_items':
                    unlocked = stats.itemsAdded >= 10;
                    break;
                case 'first_streak':
                    unlocked = stats.currentStreak >= 2;
                    break;
                case 'create_5_lists':
                    unlocked = stats.listsCreated >= 5;
                    break;
                case 'complete_5_lists':
                    unlocked = stats.listsCompleted >= 5;
                    break;
                case 'add_50_items':
                    unlocked = stats.itemsAdded >= 50;
                    break;
                case 'streak_7':
                    unlocked = stats.currentStreak >= 7;
                    break;
                case 'level_5':
                    unlocked = stats.level >= 5;
                    break;
                case 'create_20_lists':
                    unlocked = stats.listsCreated >= 20;
                    break;
                case 'complete_20_lists':
                    unlocked = stats.listsCompleted >= 20;
                    break;
                case 'add_200_items':
                    unlocked = stats.itemsAdded >= 200;
                    break;
                case 'streak_30':
                    unlocked = stats.currentStreak >= 30;
                    break;
                case 'level_8':
                    unlocked = stats.level >= 8;
                    break;
                case 'create_50_lists':
                    unlocked = stats.listsCreated >= 50;
                    break;
                case 'complete_50_lists':
                    unlocked = stats.listsCompleted >= 50;
                    break;
                case 'add_500_items':
                    unlocked = stats.itemsAdded >= 500;
                    break;
                case 'streak_100':
                    unlocked = stats.currentStreak >= 100;
                    break;
                case 'level_10':
                    unlocked = stats.level >= 10;
                    break;
            }

            if (unlocked) {
                profile.achievements.push(achievement.id);
                await this.addXP(achievement.xpReward);
                unlockedNow.push(achievement);
            }
        }

        await storageService.saveProfile(profile);
        return unlockedNow;
    },

    async getChallenges(): Promise<Challenge[]> {
        const stored = await AsyncStorage.getItem('@challenges');
        if (stored) {
            const challenges: Challenge[] = JSON.parse(stored);
            const now = Date.now();
            // Filter out expired challenges
            const valid = challenges.filter(c => c.expiresAt > now);

            // Check if we need new challenges
            const hasDaily = valid.some(c => c.type === 'daily');
            const hasWeekly = valid.some(c => c.type === 'weekly');
            const hasMonthly = valid.some(c => c.type === 'monthly');

            let updated = [...valid];
            if (!hasDaily) updated = [...updated, ...generateDailyChallenges()];
            if (!hasWeekly) updated = [...updated, ...generateWeeklyChallenges()];
            if (!hasMonthly) updated = [...updated, ...generateMonthlyChallenges()];

            await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
            return updated;
        }

        // First time - generate all challenges
        const challenges = [
            ...generateDailyChallenges(),
            ...generateWeeklyChallenges(),
            ...generateMonthlyChallenges(),
        ];
        await AsyncStorage.setItem('@challenges', JSON.stringify(challenges));
        return challenges;
    },

    async updateChallengeProgress(type: string, amount: number = 1): Promise<Challenge[]> {
        const challenges = await this.getChallenges();
        const completedNow: Challenge[] = [];

        for (const challenge of challenges) {
            if (challenge.completed) continue;

            // Update progress based on action type
            if (
                (type === 'add_item' && challenge.id.includes('add_')) ||
                (type === 'complete_list' && challenge.id.includes('complete')) ||
                (type === 'check_item' && challenge.id.includes('check')) ||
                (type === 'create_list' && challenge.id.includes('lists')) ||
                (type === 'streak' && challenge.id.includes('streak'))
            ) {
                challenge.progress += amount;
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                    await this.addXP(challenge.xpReward);
                    completedNow.push(challenge);
                }
            }
        }

        await AsyncStorage.setItem('@challenges', JSON.stringify(challenges));
        return completedNow;
    },
};
