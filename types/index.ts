// Core Types

export interface ShoppingItem {
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    category: string;
    completed: boolean;
    price?: number;
    notes?: string;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingItem[];
    createdAt: number;
    updatedAt: number;
    budget?: number;
    shareCode?: string;
    members?: string[];
    completedAt?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    category: 'bronze' | 'silver' | 'gold' | 'platinum';
    xpReward: number;
    condition: () => boolean;
    icon?: string;
}

export interface UserStats {
    listsCreated: number;
    itemsAdded: number;
    itemsCompleted: number;
    listsCompleted: number;
    daysActive: number;
    currentStreak: number;
    lastActiveDate: string;
    xp: number;
    level: number;
}

export interface UserSettings {
    theme: 'light' | 'dark';
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    currency: string;
}

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    stats: UserStats;
    achievements: string[];
    settings: UserSettings;
    isPremium?: boolean;
}

export interface Recipe {
    id: string;
    name: string;
    time: string;
    calories: string;
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
    ingredients: string[];
    isFavorite?: boolean;
}

// Group Types
export interface GroupMember {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    joinedAt: number;
    avatar?: string;
}

export interface GroupMessage {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
    isCompleted: boolean;
    completedBy?: string;
}

export interface GroupActivity {
    id: string;
    type: 'create_list' | 'add_member' | 'message' | 'complete_message' | 'join_group';
    userId: string;
    userName: string;
    content: string; // "Added Milk", "Created LIST BBQ"
    timestamp: number;
    meta?: any; // Extra data like listId
}

export interface Group {
    id: string;
    name: string;
    code: string;
    members: GroupMember[];
    messages: GroupMessage[];
    activities: GroupActivity[];
    createdAt: number;
    lists: string[]; // List IDs shared with this group
}
