import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from './storage-service';
import { Achievement } from '../types';

// 10 Níveis do Sistema
export const LEVELS = [
    { level: 1, name: 'Iniciante', xpRequired: 0, icon: '🌱' },
    { level: 2, name: 'Explorador', xpRequired: 100, icon: '🔍' },
    { level: 3, name: 'Organizador', xpRequired: 250, icon: '📋' },
    { level: 4, name: 'Colaborador', xpRequired: 500, icon: '🤝' },
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
    { id: 'first_task', title: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', category: 'bronze', xpReward: 25, condition: () => true, icon: '✅' },
    { id: 'first_create', title: 'Organizador', description: 'Crie sua primeira tarefa', category: 'bronze', xpReward: 10, condition: () => true, icon: '📝' },
    { id: 'complete_5', title: 'Produtivo', description: 'Complete 5 tarefas', category: 'bronze', xpReward: 50, condition: () => true, icon: '🎯' },
    { id: 'first_week', title: 'Consistente', description: 'Use o app por 2 dias seguidos', category: 'bronze', xpReward: 40, condition: () => true, icon: '⚡' },
    { id: 'team_player', title: 'Membro Ativo', description: 'Participe de um grupo', category: 'bronze', xpReward: 35, condition: () => true, icon: '👨‍👩‍👧‍👦' },
    { id: 'first_blitz', title: 'Blitz Iniciante', description: 'Participe de um Modo Blitz', category: 'bronze', xpReward: 30, condition: () => true, icon: '⚡' },

    // SILVER (6 conquistas)
    { id: 'complete_20', title: 'Dedicado', description: 'Complete 20 tarefas', category: 'silver', xpReward: 75, condition: () => true, icon: '🌟' },
    { id: 'streak_7', title: 'Uma Semana', description: 'Mantenha um streak de 7 dias', category: 'silver', xpReward: 120, condition: () => true, icon: '🗓️' },
    { id: 'earn_500', title: 'Pontuador', description: 'Acumule 500 pontos', category: 'silver', xpReward: 100, condition: () => true, icon: '💰' },
    { id: 'leader_week', title: 'Líder Semanal', description: 'Seja líder da semana', category: 'silver', xpReward: 80, condition: () => true, icon: '🥇' },
    { id: 'level_5', title: 'Expert', description: 'Alcance o nível 5', category: 'silver', xpReward: 150, condition: () => true, icon: '⭐' },
    { id: 'redeem_reward', title: 'Merecedor', description: 'Resgate uma recompensa', category: 'silver', xpReward: 60, condition: () => true, icon: '🎁' },

    // GOLD (6 conquistas)
    { id: 'complete_100', title: 'Mestre das Tarefas', description: 'Complete 100 tarefas', category: 'gold', xpReward: 200, condition: () => true, icon: '🏆' },
    { id: 'streak_30', title: 'Um Mês', description: 'Mantenha um streak de 30 dias', category: 'gold', xpReward: 300, condition: () => true, icon: '📅' },
    { id: 'earn_2000', title: 'Milionário', description: 'Acumule 2000 pontos', category: 'gold', xpReward: 220, condition: () => true, icon: '💎' },
    { id: 'harmony_100', title: 'Harmonia Total', description: 'Alcance 100% no termômetro', category: 'gold', xpReward: 180, condition: () => true, icon: '🌡️' },
    { id: 'level_8', title: 'Lenda', description: 'Alcance o nível 8', category: 'gold', xpReward: 280, condition: () => true, icon: '👑' },
    { id: 'blitz_winner', title: 'Campeão Blitz', description: 'Vença 5 Modo Blitz', category: 'gold', xpReward: 250, condition: () => true, icon: '🏅' },

    // PLATINUM (6 conquistas)
    { id: 'complete_500', title: 'Lendário', description: 'Complete 500 tarefas', category: 'platinum', xpReward: 400, condition: () => true, icon: '💫' },
    { id: 'streak_100', title: 'Centenário', description: 'Mantenha um streak de 100 dias', category: 'platinum', xpReward: 600, condition: () => true, icon: '💯' },
    { id: 'earn_10000', title: 'Bilionário', description: 'Acumule 10000 pontos', category: 'platinum', xpReward: 500, condition: () => true, icon: '👑' },
    { id: 'all_rewards', title: 'Colecionador', description: 'Resgate 20 recompensas', category: 'platinum', xpReward: 450, condition: () => true, icon: '🎪' },
    { id: 'level_10', title: 'Supremo', description: 'Alcance o nível máximo', category: 'platinum', xpReward: 1000, condition: () => true, icon: '💎' },
    { id: 'perfect_month', title: 'Mês Perfeito', description: 'Complete todas as tarefas por 30 dias', category: 'platinum', xpReward: 800, condition: () => true, icon: '🌟' },
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
            id: `daily_complete_3_${now}`,
            title: 'Complete 3 Tarefas',
            description: 'Complete 3 tarefas hoje',
            type: 'daily',
            xpReward: 20,
            target: 3,
            progress: 0,
            completed: false,
            expiresAt: endOfDay.getTime(),
        },
        {
            id: `daily_earn_50_${now}`,
            title: 'Ganhe 50 Pontos',
            description: 'Acumule 50 pontos hoje',
            type: 'daily',
            xpReward: 25,
            target: 50,
            progress: 0,
            completed: false,
            expiresAt: endOfDay.getTime(),
        },
        {
            id: `daily_high_priority_${now}`,
            title: 'Prioridade Alta',
            description: 'Complete 1 tarefa de alta prioridade',
            type: 'daily',
            xpReward: 30,
            target: 1,
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
            id: `weekly_complete_20_${now}`,
            title: 'Complete 20 Tarefas',
            description: 'Complete 20 tarefas esta semana',
            type: 'weekly',
            xpReward: 75,
            target: 20,
            progress: 0,
            completed: false,
            expiresAt: endOfWeek.getTime(),
        },
        {
            id: `weekly_earn_300_${now}`,
            title: 'Ganhe 300 Pontos',
            description: 'Acumule 300 pontos esta semana',
            type: 'weekly',
            xpReward: 100,
            target: 300,
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
            title: 'Complete 100 Tarefas',
            description: 'Complete 100 tarefas este mês',
            type: 'monthly',
            xpReward: 250,
            target: 100,
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

        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (currentXP >= LEVELS[i].xpRequired) {
                currentLevelInfo = LEVELS[i];
                nextLevelInfo = LEVELS[i + 1] || { ...LEVELS[i], xpRequired: LEVELS[i].xpRequired * 2 };
                break;
            }
        }

        const xpForCurrentLevel = currentLevelInfo.xpRequired;
        const xpForNextLevel = nextLevelInfo.xpRequired;
        const xpInCurrentLevel = currentXP - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

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

        if (newStreak === 7) await this.addXP(50);
        else if (newStreak === 30) await this.addXP(150);
        else if (newStreak === 100) await this.addXP(500);
        else await this.addXP(5);

        return { streak: newStreak, isNewDay: true };
    },

    async checkAchievements(): Promise<Achievement[]> {
        const profile = await storageService.getProfile();
        if (!profile) return [];

        const unlockedNow: Achievement[] = [];
        const stats = profile.stats;

        for (const achievement of ACHIEVEMENTS) {
            if (profile.achievements.includes(achievement.id)) continue;

            let unlocked = false;
            switch (achievement.id) {
                case 'first_task':
                    unlocked = stats.tasksCompleted >= 1;
                    break;
                case 'first_create':
                    unlocked = stats.tasksCreated >= 1;
                    break;
                case 'complete_5':
                    unlocked = stats.tasksCompleted >= 5;
                    break;
                case 'first_week':
                    unlocked = stats.currentStreak >= 2;
                    break;
                case 'complete_20':
                    unlocked = stats.tasksCompleted >= 20;
                    break;
                case 'streak_7':
                    unlocked = stats.currentStreak >= 7;
                    break;
                case 'earn_500':
                    unlocked = stats.totalPoints >= 500;
                    break;
                case 'level_5':
                    unlocked = stats.level >= 5;
                    break;
                case 'complete_100':
                    unlocked = stats.tasksCompleted >= 100;
                    break;
                case 'streak_30':
                    unlocked = stats.currentStreak >= 30;
                    break;
                case 'earn_2000':
                    unlocked = stats.totalPoints >= 2000;
                    break;
                case 'level_8':
                    unlocked = stats.level >= 8;
                    break;
                case 'complete_500':
                    unlocked = stats.tasksCompleted >= 500;
                    break;
                case 'streak_100':
                    unlocked = stats.currentStreak >= 100;
                    break;
                case 'earn_10000':
                    unlocked = stats.totalPoints >= 10000;
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
            const valid = challenges.filter(c => c.expiresAt > now);

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

            if (
                (type === 'complete_task' && challenge.id.includes('complete')) ||
                (type === 'earn_points' && challenge.id.includes('earn')) ||
                (type === 'high_priority' && challenge.id.includes('high_priority')) ||
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
