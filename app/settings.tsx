import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    TextInput,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Menu, Moon, Sun, Bell, Volume2, Smartphone, Trash2, ChevronRight, HelpCircle, Shield, Edit2, X, LogOut
} from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { storageService } from '../services/storage-service';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DrawerMenu } from '../components/DrawerMenu';
import { UserProfile } from '../types';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, updateProfile, logout, deleteAccount } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        const p = await storageService.getProfile();
        setProfile(p || {
            id: 'default', name: user?.name, email: user?.email,
            stats: { tasksCompleted: 0, tasksCreated: 0, daysActive: 0, currentStreak: 0, lastActiveDate: '', xp: 0, level: 1, totalPoints: 0 },
            achievements: [],
            settings: { theme: 'light', notificationsEnabled: true, soundEnabled: true, hapticEnabled: true, currency: 'BRL' }
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const updateSetting = async (key: keyof UserProfile['settings'], value: any) => {
        if (!profile) return;
        const newProfile = { ...profile, settings: { ...profile.settings, [key]: value } };
        setProfile(newProfile);
        await storageService.saveProfile(newProfile);
    };

    const openEditProfile = () => { setEditName(user?.name || ''); setEditEmail(user?.email || ''); setShowEditModal(true); };
    const saveProfile = async () => { if (editName.trim()) await updateProfile({ name: editName.trim(), email: editEmail.trim() }); setShowEditModal(false); };
    const handleLogout = () => Alert.alert('Sair', 'Tem certeza?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/goodbye'); } }]);
    const handleDeleteAccount = () => Alert.alert('Excluir Conta', 'Isso apagará todos os seus dados.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteAccount(); router.replace('/onboarding'); } }]);
    const clearData = () => Alert.alert('Apagar Dados', 'Apagar todas as tarefas e histórico?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: async () => { await storageService.clearAll(); Alert.alert('Sucesso', 'Dados apagados.'); loadProfile(); } }]);

    // WCAG 2.1 AA Compliant Colors
    const bgColor = isDark ? darkColors.background : colors.background;
    const cardColor = isDark ? darkColors.card : colors.white;
    const textColor = isDark ? darkColors.textPrimary : colors.textPrimary;
    const mutedColor = isDark ? darkColors.textMuted : colors.textMuted;
    const borderColor = isDark ? darkColors.border : colors.border;

    if (!profile) return null;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header with Greeting */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Configurações</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
                {/* Profile Card */}
                <TouchableOpacity style={[styles.profileCard, { backgroundColor: cardColor }]} onPress={openEditProfile}>
                    <View style={styles.profileAvatar}><Text style={styles.avatarEmoji}>👤</Text></View>
                    <View style={styles.profileInfo}><Text style={[styles.profileName, { color: textColor }]}>{user?.name || 'Usuário'}</Text><Text style={[styles.profileEmail, { color: mutedColor }]}>{user?.email || 'Toque para editar'}</Text></View>
                    <Edit2 color={colors.primary} size={20} />
                </TouchableOpacity>

                {/* Aparência */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>APARÊNCIA</Text>
                    <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
                        <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.warning + '20' : '#1F2937' }]}>
                            {isDark ? <Moon color={colors.warning} size={20} /> : <Sun color={colors.white} size={20} />}
                        </View>
                        <Text style={[styles.menuLabel, { color: textColor }]}>{isDark ? 'Modo Escuro' : 'Modo Claro'}</Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: borderColor, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Notificações */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>NOTIFICAÇÕES</Text>
                    <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}><Bell color={colors.warning} size={20} /></View>
                        <Text style={[styles.menuLabel, { color: textColor }]}>Notificações Push</Text>
                        <Switch value={profile.settings.notificationsEnabled} onValueChange={(v) => updateSetting('notificationsEnabled', v)} trackColor={{ false: borderColor, true: colors.primary }} thumbColor={colors.white} />
                    </View>
                    <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.teal + '20' }]}><Volume2 color={colors.teal} size={20} /></View>
                        <Text style={[styles.menuLabel, { color: textColor }]}>Sons</Text>
                        <Switch value={profile.settings.soundEnabled} onValueChange={(v) => updateSetting('soundEnabled', v)} trackColor={{ false: borderColor, true: colors.primary }} thumbColor={colors.white} />
                    </View>
                    <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.orange + '20' }]}><Smartphone color={colors.orange} size={20} /></View>
                        <Text style={[styles.menuLabel, { color: textColor }]}>Vibração</Text>
                        <Switch value={profile.settings.hapticEnabled} onValueChange={(v) => updateSetting('hapticEnabled', v)} trackColor={{ false: borderColor, true: colors.primary }} thumbColor={colors.white} />
                    </View>
                </View>

                {/* Suporte */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>SUPORTE</Text>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardColor }]}><View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}><HelpCircle color={colors.primary} size={20} /></View><Text style={[styles.menuLabel, { color: textColor }]}>Central de Ajuda</Text><ChevronRight color={mutedColor} size={20} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardColor }]}><View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}><Shield color={colors.primary} size={20} /></View><Text style={[styles.menuLabel, { color: textColor }]}>Privacidade</Text><ChevronRight color={mutedColor} size={20} /></TouchableOpacity>
                </View>

                {/* Conta */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>CONTA</Text>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardColor }]} onPress={handleLogout}><View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}><LogOut color={colors.warning} size={20} /></View><Text style={[styles.menuLabel, { color: textColor }]}>Sair</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardColor }]} onPress={clearData}><View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}><Trash2 color={colors.error} size={20} /></View><Text style={[styles.menuLabel, { color: colors.error }]}>Apagar Dados</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardColor }]} onPress={handleDeleteAccount}><View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}><Trash2 color={colors.error} size={20} /></View><Text style={[styles.menuLabel, { color: colors.error }]}>Excluir Conta</Text></TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: mutedColor }]}>Versão 1.2.0</Text>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: textColor }]}>Editar Perfil</Text><TouchableOpacity onPress={() => setShowEditModal(false)}><X color={mutedColor} size={24} /></TouchableOpacity></View>
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Nome</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={editName} onChangeText={setEditName} placeholder="Seu nome" placeholderTextColor={mutedColor} />
                        <Text style={[styles.inputLabel, { color: mutedColor }]}>Email</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: bgColor, color: textColor }]} value={editEmail} onChangeText={setEditEmail} placeholder="seu@email.com" placeholderTextColor={mutedColor} keyboardType="email-address" autoCapitalize="none" />
                        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}><Text style={styles.saveButtonText}>Salvar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    menuButton: { padding: spacing.sm, marginRight: spacing.md },
    headerTextContainer: { flex: 1 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    headerTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    content: { flex: 1 },
    profileCard: { flexDirection: 'row', alignItems: 'center', margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, ...shadows.sm },
    profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    avatarEmoji: { fontSize: 28 },
    profileInfo: { flex: 1 },
    profileName: { fontSize: fontSize.lg, fontWeight: 'bold' },
    profileEmail: { fontSize: fontSize.sm, marginTop: 2 },
    section: { marginTop: spacing.md, paddingHorizontal: spacing.lg },
    sectionTitle: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.md, letterSpacing: 0.5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
    menuIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    menuLabel: { flex: 1, fontSize: fontSize.md },
    version: { textAlign: 'center', fontSize: fontSize.sm, marginTop: spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
    modalContent: { borderRadius: borderRadius.lg, padding: spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    inputLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs },
    modalInput: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.md },
    saveButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    saveButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
