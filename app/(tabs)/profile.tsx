import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { User, Globe, Moon, Sun, LogOut, Crown, TrendingUp, Bell, Settings, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../services/picks-service';

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
    const { data: stats, isLoading: statsLoading } = useUserStats();

    const currentLang = i18n.language || 'pt';

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
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
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                <Text style={styles.headerDate}>{formatDate()}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View style={[styles.profileCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.accentOrange }]}>
                        <User color="#FFFFFF" size={32} />
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{profile?.full_name || t('profile.user')}</Text>
                    <View style={[styles.planBadge, { backgroundColor: isPremium ? colors.accentOrange : colors.statusGreen }]}>
                        <Crown color="#FFFFFF" size={12} />
                        <Text style={styles.planText}>{isPremium ? t('common.premium').toUpperCase() : t('common.free').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.statistics')}</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <TrendingUp color={colors.statusGreen} size={24} />
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{statsLoading ? '—' : stats?.totalPicks ?? 0}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.total_picks')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.statValue, { color: colors.statusGreen }]}>{statsLoading ? '—' : `${stats?.hitRate7Days ?? 0}%`}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.hit_rate_7days')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.statValue, { color: (stats?.roi ?? 0) >= 0 ? colors.statusGreen : colors.statusRed }]}>
                                {statsLoading ? '—' : `${(stats?.roi ?? 0) > 0 ? '+' : ''}${stats?.roi ?? 0}%`}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.roi')}</Text>
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
                            onPress={() => Alert.alert(t('premium.title'), '')}
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
                    >
                        <LogOut color={colors.statusRed} size={20} />
                        <Text style={[styles.signOutText, { color: colors.statusRed }]}>{t('profile.sign_out')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.appInfo, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.appInfoText, { color: colors.textMuted }]}>
                        GoalEdge v1.0.0{'\n'}{t('app.tagline')}
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
    profileCard: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    userName: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 4 },
    planText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    section: { padding: 16, paddingTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    statsGrid: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
    statLabel: { fontSize: 11, marginTop: 4 },
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
