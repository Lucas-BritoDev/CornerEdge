// Core Types - Organizador de Atividades Domésticas

// ====================
// HOUSEHOLD TYPES
// ====================

export interface HouseholdMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'member';
    points: number;
    joinedAt: number;
}

export interface HouseholdTask {
    id: string;
    name: string;
    description?: string;
    category: 'limpeza' | 'cozinha' | 'lavanderia' | 'jardim' | 'organizacao' | 'quarto' | 'outros';
    frequency: 'daily' | 'weekly' | 'monthly' | 'once';
    assignedTo?: string; // member id
    priority: 'low' | 'medium' | 'high';
    points: number;
    dueDate?: number;
    completed: boolean;
    createdAt: number;
    createdBy: string;
}

export interface TaskCompletion {
    id: string;
    taskId: string;
    taskName: string;
    completedBy: string;
    completedByName: string;
    completedAt: number;
    pointsEarned: number;
}

export interface Household {
    id: string;
    name: string;
    code: string;
    members: HouseholdMember[];
    tasks: HouseholdTask[];
    completions: TaskCompletion[];
    createdAt: number;
}

// ====================
// ACHIEVEMENTS & GAMIFICATION
// ====================

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
    tasksCompleted: number;
    tasksCreated: number;
    daysActive: number;
    currentStreak: number;
    lastActiveDate: string;
    xp: number;
    level: number;
    totalPoints: number;
}

export interface UserSettings {
    theme: 'light' | 'dark';
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    language?: string;
    currency?: string;
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
    householdId?: string;
}

// ====================
// GROUP/HOUSEHOLD COMMUNICATION
// ====================

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
    type: 'create_task' | 'complete_task' | 'add_member' | 'message' | 'join_group';
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
    meta?: any;
}

export interface Group {
    id: string;
    name: string;
    code: string;
    members: GroupMember[];
    messages: GroupMessage[];
    activities: GroupActivity[];
    createdAt: number;
    tasks: string[]; // Task IDs
}

// ====================
// TASK CATEGORIES
// ====================

export const TASK_CATEGORIES = [
    { id: 'limpeza', name: 'Limpeza', icon: '🧹', color: '#3B82F6' },
    { id: 'cozinha', name: 'Cozinha', icon: '🍳', color: '#F59E0B' },
    { id: 'lavanderia', name: 'Lavanderia', icon: '👕', color: '#8B5CF6' },
    { id: 'jardim', name: 'Jardim', icon: '🌱', color: '#10B981' },
    { id: 'quarto', name: 'Quarto', icon: '🛏️', color: '#F97316' },
    { id: 'organizacao', name: 'Organização', icon: '📦', color: '#EC4899' },
    { id: 'outros', name: 'Outros', icon: '📋', color: '#6B7280' },
] as const;

export const TASK_FREQUENCIES = [
    { id: 'daily', name: 'Diária', description: 'Repete todo dia' },
    { id: 'weekly', name: 'Semanal', description: 'Repete toda semana' },
    { id: 'monthly', name: 'Mensal', description: 'Repete todo mês' },
    { id: 'once', name: 'Única', description: 'Não repete' },
] as const;

export const TASK_PRIORITIES = [
    { id: 'low', name: 'Baixa', color: '#10B981' },
    { id: 'medium', name: 'Média', color: '#F59E0B' },
    { id: 'high', name: 'Alta', color: '#EF4444' },
] as const;
