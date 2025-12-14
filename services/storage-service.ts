import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, HouseholdTask, Household } from '../types';

const PROFILE_KEY = '@profile';
const TASKS_KEY = '@tasks';
const HOUSEHOLD_KEY = '@household';

export const storageService = {
    // Tasks
    async getTasks(): Promise<HouseholdTask[]> {
        try {
            const data = await AsyncStorage.getItem(TASKS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    },

    async saveTasks(tasks: HouseholdTask[]): Promise<void> {
        try {
            await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    },

    // Household
    async getHousehold(): Promise<Household | null> {
        try {
            const data = await AsyncStorage.getItem(HOUSEHOLD_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting household:', error);
            return null;
        }
    },

    async saveHousehold(household: Household): Promise<void> {
        try {
            await AsyncStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(household));
        } catch (error) {
            console.error('Error saving household:', error);
        }
    },

    // Profile
    async getProfile(): Promise<UserProfile | null> {
        try {
            const data = await AsyncStorage.getItem(PROFILE_KEY);
            if (data) return JSON.parse(data);

            const defaultProfile: UserProfile = {
                id: 'default',
                name: 'Usuário',
                stats: {
                    tasksCreated: 0,
                    tasksCompleted: 0,
                    totalPoints: 0,
                    daysActive: 0,
                    currentStreak: 0,
                    lastActiveDate: '',
                    xp: 0,
                    level: 1,
                },
                achievements: [],
                settings: {
                    theme: 'light',
                    notificationsEnabled: true,
                    soundEnabled: true,
                    hapticEnabled: true,
                    currency: 'BRL',
                },
            };
            await this.saveProfile(defaultProfile);
            return defaultProfile;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    },

    async saveProfile(profile: UserProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([TASKS_KEY, PROFILE_KEY, HOUSEHOLD_KEY, '@challenges']);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    },
};
