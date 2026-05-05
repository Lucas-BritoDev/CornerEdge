// Core Types - Base Template

// ====================
// USER TYPES
// ====================

export interface UserSettings {
    theme: 'light' | 'dark';
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    language?: string;
}

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    settings: UserSettings;
    createdAt: number;
}

// ====================
// ADICIONE SEUS TIPOS AQUI
// ====================

// Exemplo:
// export interface MyCustomType {
//     id: string;
//     name: string;
//     createdAt: number;
// }
