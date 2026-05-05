import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, X, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { isPremium, user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // This would normally open Stripe Checkout or Google Play Billing
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { userId: user?.id, email: user?.email },
            });

            if (error) throw error;
            if (data?.url) {
                // Open URL in browser
                Alert.alert('Redirecionando...', 'Abrindo checkout seguro Stripe: ' + data.url);
            } else {
                Alert.alert('Sucesso', 'Mock de assinatura concluído!');
            }
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = () => {
        Alert.alert('Restaurar', 'Buscando compras anteriores...');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>GoalEdge Premium</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={[styles.heroSection, { backgroundColor: colors.backgroundTertiary }]}>
                    <Crown color={colors.accentGold} size={64} style={{ marginBottom: 16 }} />
                    <Text style={styles.heroTitle}>Desbloqueie seu Potencial</Text>
                    <Text style={styles.heroSubtitle}>Tenha acesso a todos os palpites e análises avançadas do nosso algoritmo.</Text>
                </View>

                <View style={styles.pricingSection}>
                    <View style={[styles.priceCard, { borderColor: colors.accentGold, backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.priceName, { color: colors.textPrimary }]}>Mensal</Text>
                        <Text style={[styles.priceValue, { color: colors.textPrimary }]}>$3,00<Text style={styles.pricePeriod}>/mês</Text></Text>
                        <Text style={[styles.priceDesc, { color: colors.textMuted }]}>Cancele quando quiser.</Text>
                    </View>
                </View>

                <View style={styles.featuresSection}>
                    <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>Comparação de Planos</Text>
                    
                    {[
                        { name: 'Picks gratuitos diários (2)', free: true, pro: true },
                        { name: 'Acesso a todos Picks Premium (até 5)', free: false, pro: true },
                        { name: 'Notificações antecipadas', free: false, pro: true },
                        { name: 'Zero Anúncios', free: false, pro: true },
                        { name: 'Estatísticas completas de histórico', free: false, pro: true },
                    ].map((feat, i) => (
                        <View key={i} style={[styles.featureRow, { borderBottomColor: colors.cardBorder }]}>
                            <Text style={[styles.featureText, { color: colors.textSecondary, flex: 1 }]}>{feat.name}</Text>
                            <View style={styles.featureIcons}>
                                {feat.free ? <Check color={colors.statusGreen} size={20} /> : <X color={colors.statusRed} size={20} />}
                                <View style={styles.iconSeparator} />
                                {feat.pro ? <Check color={colors.accentGold} size={20} /> : <X color={colors.statusRed} size={20} />}
                            </View>
                        </View>
                    ))}
                    <View style={styles.featureLegend}>
                        <Text style={[styles.legendText, { color: colors.textMuted }]}>Free</Text>
                        <Text style={[styles.legendText, { color: colors.accentGold }]}>Premium</Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    {isPremium ? (
                        <View style={[styles.premiumActiveBadge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accentGold }]}>
                            <ShieldCheck color={colors.accentGold} size={24} />
                            <Text style={[styles.premiumActiveText, { color: colors.textPrimary }]}>Você já é Premium!</Text>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.subscribeBtn, { backgroundColor: colors.accentGold }]}
                            onPress={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : (
                                <Text style={styles.subscribeBtnText}>Assinar Agora</Text>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
                        <Text style={[styles.restoreBtnText, { color: colors.textMuted }]}>Restaurar Compras</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
    heroSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    pricingSection: { padding: 24, marginTop: -32 },
    priceCard: { padding: 24, borderRadius: 16, borderWidth: 2, alignItems: 'center' },
    priceName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    priceValue: { fontSize: 36, fontWeight: 'bold' },
    pricePeriod: { fontSize: 16, fontWeight: 'normal' },
    priceDesc: { fontSize: 13, marginTop: 8 },
    featuresSection: { paddingHorizontal: 24 },
    featuresTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    featureRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, alignItems: 'center' },
    featureText: { fontSize: 14, paddingRight: 16 },
    featureIcons: { flexDirection: 'row', width: 80, justifyContent: 'space-between', alignItems: 'center' },
    iconSeparator: { width: 1, height: 20, backgroundColor: '#E5E7EB' },
    featureLegend: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 32 },
    legendText: { fontSize: 12, fontWeight: '600', width: 35, textAlign: 'center' },
    actionSection: { padding: 24, alignItems: 'center' },
    subscribeBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    subscribeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    restoreBtn: { padding: 8 },
    restoreBtnText: { fontSize: 14 },
    premiumActiveBadge: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    premiumActiveText: { fontSize: 16, fontWeight: 'bold' },
});
