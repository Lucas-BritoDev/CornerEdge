import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList, UserProfile } from '../types';

const LISTS_KEY = '@lists';
const PROFILE_KEY = '@profile';

export const storageService = {
    // Lists
    async getLists(): Promise<ShoppingList[]> {
        try {
            const data = await AsyncStorage.getItem(LISTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting lists:', error);
            return [];
        }
    },

    async saveLists(lists: ShoppingList[]): Promise<void> {
        try {
            await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
        } catch (error) {
            console.error('Error saving lists:', error);
        }
    },

    // Profile
    async getProfile(): Promise<UserProfile | null> {
        try {
            const data = await AsyncStorage.getItem(PROFILE_KEY);
            if (data) return JSON.parse(data);
            // Return default profile if none exists
            const defaultProfile: UserProfile = {
                id: 'default',
                name: 'Usuário',
                stats: {
                    listsCreated: 0,
                    itemsAdded: 0,
                    itemsCompleted: 0,
                    listsCompleted: 0,
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
            await AsyncStorage.multiRemove([LISTS_KEY, PROFILE_KEY, '@challenges']);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    },
};
