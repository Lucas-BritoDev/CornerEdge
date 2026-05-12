import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { User, Globe, Moon, Sun, LogOut, Crown, TrendingUp, Bell, Settings, ChevronRight, Target, Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../services/analyses-service';
import { Header } from '../../components/Header';

const languages = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
];

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, setTheme, resolvedTheme } = useTheme();
    const { user, profile, signOut, isPremium } = useAuth();
    const { t, i18n } = useTranslation();
    const [notifications, setNotifications] = React.useState(true);
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    const { data: stats, isLoading: isStatsLoading } = useUserStats();

    const currentLang = i18n.language || 'pt';

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleSignOut = async () => {
        try {
            setIsSigningOut(true);
            await signOut();
            // AuthGate no _layout.tsx redireciona automaticamente para /login
            // quando user vira null após o signOut
        } catch (error) {
            console.error('Erro ao sair:', error);
            Alert.alert(t('common.error') || 'Erro', t('profile.sign_out_error') || 'Não foi possível sair. Tente novamente.');
            setIsSigningOut(false);
        }
    };

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <ActivityIndicator size="large" color={colors.accentOrange} />
            </View>
        );
    }

    const cycleTheme = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const changeLang = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header 
                title="CornerEdge" 
                subtitle={formatDate()} 
            >
                <View style={styles.headerStatsRow}>
                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <TrendingUp size={16} color="#FFF" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                {isStatsLoading ? '—' : stats?.totalAnalyses ?? 0}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.total_analyses')}</Text>
                        </View>
                    </View>

                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Target size={16} color="#4ADE80" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#4ADE80' }]}>
                                {isStatsLoading ? '—' : stats?.hitRate7Days != null ? `${stats.hitRate7Days}%` : '—'}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('results.hit_rate')}</Text>
                        </View>
                    </View>

                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Activity size={16} color="#FFF" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                {isStatsLoading ? '—' : `${stats?.correct ?? 0}/${stats?.incorrect ?? 0}`}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.accuracy')}</Text>
                        </View>
                    </View>
                </View>
            </Header>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View style={[styles.profileCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.accentOrange }]}>
                        <User color="#FFFFFF" size={32} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{profile?.full_name || t('profile.user')}</Text>
                        <View style={[styles.planBadge, { backgroundColor: isPremium ? colors.accentOrange : colors.statusGreen }]}>
                            <Crown color="#FFFFFF" size={10} />
                            <Text style={styles.planText}>{isPremium ? t('common.premium').toUpperCase() : t('common.free').toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.settings')}</Text>
                    
                    <View style={[styles.settingRow, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.settingIcon}>
                            <Globe color={colors.textSecondary} size={20} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('profile.language')}</Text>
                            <Text style={[styles.settingValue, { color: colors.textMuted }]}>{t('profile.select_language')}</Text>
                        </View>
                    </View>
                    <View style={[styles.languageOptions, { backgroundColor: colors.backgroundSecondary }]}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.langButton,
                                    { backgroundColor: currentLang === lang.code ? colors.accentOrange : colors.background }
                                ]}
                                onPress={() => changeLang(lang.code)}
                            >
                                <Text style={styles.langFlag}>{lang.flag}</Text>
                                <Text style={[
                                    styles.langLabel,
                                    { color: currentLang === lang.code ? '#FFFFFF' : colors.textPrimary }
                                ]}>{lang.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.settingRow, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.settingIcon}>
                            {resolvedTheme === 'dark' ? (
                                <Moon color={colors.textSecondary} size={20} />
                            ) : (
                                <Sun color={colors.textSecondary} size={20} />
                            )}
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('profile.theme')}</Text>
                            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
                                {resolvedTheme === 'dark' ? t('profile.dark_mode') : t('profile.light_mode')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={cycleTheme} style={[styles.themeToggle, { backgroundColor: colors.accentOrange }]}>
                            <Text style={styles.themeToggleText}>
                                {resolvedTheme === 'dark' ? '🌙' : '☀️'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.settingRow, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.settingIcon}>
                            <Bell color={colors.textSecondary} size={20} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('profile.notifications')}</Text>
                            <Text style={[styles.settingValue, { color: colors.textMuted }]}>{t('profile.daily_alerts')}</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: colors.cardBorder, true: colors.statusGreen }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    {isPremium ? (
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                            onPress={() => Alert.alert(t('premium.manage'), '')}
                        >
                            <Settings color={colors.textPrimary} size={20} />
                            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>{t('premium.manage')}</Text>
                            <ChevronRight color={colors.textMuted} size={20} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.upgradeButton, { backgroundColor: colors.accentOrange }]}
                            onPress={() => router.push('/(tabs)/premium')}
                        >
                            <Crown color="#FFFFFF" size={20} />
                            <Text style={styles.upgradeButtonText}>{t('profile.upgrade')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <TouchableOpacity 
                        style={[styles.signOutButton, { borderColor: colors.statusRed }]} 
                        onPress={handleSignOut}
                        disabled={isSigningOut}
                    >
                        {isSigningOut ? (
                            <ActivityIndicator color={colors.statusRed} size="small" />
                        ) : (
                            <LogOut color={colors.statusRed} size={20} />
                        )}
                        <Text style={[styles.signOutText, { color: colors.statusRed }]}>
                            {isSigningOut ? (t('profile.signing_out') || 'Saindo...') : t('profile.sign_out')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.appInfo, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.appInfoText, { color: colors.textMuted }]}>
                        CornerEdge v1.0.0{'\n'}{t('app.tagline')}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    headerDate: { color: '#FFFFFF', fontSize: 14, opacity: 0.8, marginTop: 4, textTransform: 'capitalize' },
    content: { flex: 1, marginTop: -12 },
    headerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 },
    headerStatCard: { 
        flex: 1, 
        padding: 10, 
        borderRadius: 16, 
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8
    },
    headerStatValue: { fontSize: 16, fontWeight: '900' },
    headerStatLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

    profileCard: { margin: 16, padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
    profileInfo: { flex: 1 },
    avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    userName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4, alignSelf: 'flex-start' },
    planText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
    settingIcon: { width: 32, alignItems: 'center' },
    settingContent: { flex: 1, marginLeft: 8 },
    settingLabel: { fontSize: 15, fontWeight: '500' },
    settingValue: { fontSize: 12, marginTop: 2 },
    languageOptions: { flexDirection: 'row', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8, marginBottom: 8 },
    langButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
    langFlag: { fontSize: 16 },
    langLabel: { fontSize: 14, fontWeight: '600' },
    themeToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    themeToggleText: { fontSize: 16 },
    actionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    actionButtonText: { flex: 1, fontSize: 15 },
    upgradeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
    upgradeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    signOutText: { fontSize: 15 },
    appInfo: { alignItems: 'center', padding: 16, marginHorizontal: 16, marginBottom: 32, borderRadius: 12 },
    appInfoText: { fontSize: 12, textAlign: 'center' },
});
