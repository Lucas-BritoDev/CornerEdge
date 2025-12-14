import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Menu,
    Plus,
    List as ListIcon,
    ChefHat,
    Users,
    Trophy,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    DollarSign,
    Target,
    Zap,
    Award,
    Store,
    ShoppingBag,
    Calendar,
    BarChart3
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storage-service';
import { ShoppingList } from '../types';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';

// Analytics Interface
interface DashboardStats {
    currentWeekSpent: number;
    lastWeekSpent: number;
    lastMonthSpent: number;
    yearSpentFood: number;
    mostBoughtItem: { name: string; count: number };
    mostExpensiveItem: { name: string; price: number };
    supermarketVisits: { type: 'big' | 'small'; count: number; name: string }[];
    dailyAverage: number;
    projectedMonthly: number;
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { width: screenWidth } = useWindowDimensions();
    const [menuOpen, setMenuOpen] = useState(false);
    const [lists, setLists] = useState<ShoppingList[]>([]);

    // Analytics State
    const [stats, setStats] = useState<DashboardStats>({
        currentWeekSpent: 12500, // in cents
        lastWeekSpent: 9800,
        lastMonthSpent: 45000,
        yearSpentFood: 1250000,
        mostBoughtItem: { name: 'Leite', count: 12 },
        mostExpensiveItem: { name: 'Picanha', price: 8990 }, // in cents
        supermarketVisits: [
            { type: 'big', count: 3, name: 'Atacadão' },
            { type: 'big', count: 2, name: 'Carrefour' },
            { type: 'small', count: 8, name: 'Mercadinho da Sú' },
            { type: 'small', count: 4, name: 'Padaria Central' }
        ],
        dailyAverage: 3500, // R$ 35,00
        projectedMonthly: 52000 // R$ 520,00
    });

    const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
    const [selectedDataPoint, setSelectedDataPoint] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const data = await storageService.getLists();
        setLists(data);
        // In real app, calculateStats(data) would go here
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    // --- CHART LOGIC (Reused & Enhanced) ---
    const getChartData = () => {
        // Enhanced mock data logic
        const currentData = chartPeriod === 'week'
            ? [120, 85, 150, 200, 180, 220, 195]
            : chartPeriod === 'month'
                ? [850, 920, 780, 1100]
                : [9500, 10200, 8900, 11500, 9800, 12000, 10500, 11200, 9600, 10800, 11500, 12500];

        const previousData = chartPeriod === 'week'
            ? [100, 120, 90, 180, 160, 200, 170]
            : chartPeriod === 'month'
                ? [780, 850, 920, 980]
                : [8500, 9200, 8100, 10500, 9000, 11000, 9800, 10200, 8900, 9800, 10500, 11500];

        return { current: currentData, previous: previousData };
    };

    const chartData = getChartData();
    // Chart Drawing Constants - Responsivo
    const chartWidth = screenWidth - spacing.lg * 3; // Usa largura dinâmica
    const chartHeight = 160;
    const paddingTop = 20;
    const paddingBottom = 30;
    const paddingLeft = 10;
    const paddingRight = 10;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    const getY = (value: number) => {
        const allValues = [...chartData.current, ...chartData.previous];
        const max = Math.max(...allValues) * 1.1;
        return paddingTop + graphHeight - (value / max) * graphHeight;
    };
    const getX = (index: number) => paddingLeft + (index / (chartData.current.length - 1)) * graphWidth;

    const getLabels = () => chartPeriod === 'week'
        ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
        : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].slice(0, chartData.current.length);

    const labels = getLabels();

    const updateSelection = (x: number) => {
        const pointWidth = graphWidth / (chartData.current.length - 1);
        // Ajuste no offset para capturar melhor
        const index = Math.round((x - paddingLeft) / pointWidth);
        const clampedIndex = Math.max(0, Math.min(index, chartData.current.length - 1));

        if (clampedIndex !== selectedDataPoint) {
            setSelectedDataPoint(clampedIndex);
        }
    };

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (evt) => {
                updateSelection(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt) => {
                updateSelection(evt.nativeEvent.locationX);
            },
            onPanResponderRelease: () => {
                // Opcional: limpar seleção ao soltar
                // setSelectedDataPoint(null);
            },
        })
    ).current;

    const renderLineChart = () => {
        const data = chartData.current;
        const prevData = chartData.previous;

        // Paths
        const createPath = (d: number[]) => {
            let path = `M ${getX(0)} ${getY(d[0])}`;
            d.forEach((val, i) => {
                if (i === 0) return;
                const prevX = getX(i - 1);
                const prevY = getY(d[i - 1]);
                const currX = getX(i);
                const currY = getY(val);
                path += ` C ${prevX + (currX - prevX) / 2} ${prevY}, ${prevX + (currX - prevX) / 2} ${currY}, ${currX} ${currY}`;
            });
            return path;
        };

        const areaPath = `${createPath(data)} L ${getX(data.length - 1)} ${chartHeight - paddingBottom} L ${getX(0)} ${chartHeight - paddingBottom} Z`;

        return (
            <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
                        <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.05" />
                    </LinearGradient>
                </Defs>
                {/* Guides */}
                <Line x1={0} y1={chartHeight - paddingBottom} x2={chartWidth} y2={chartHeight - paddingBottom} stroke={isDark ? '#374151' : '#E5E7EB'} />

                <Path d={createPath(prevData)} stroke={isDark ? '#4B5563' : '#9CA3AF'} strokeWidth={2} strokeDasharray="4,4" fill="none" />
                <Path d={areaPath} fill="url(#gradient)" />
                <Path d={createPath(data)} stroke={colors.primary} strokeWidth={3} fill="none" />

                {/* Dots */}
                {data.map((val, i) => (
                    <Circle key={i} cx={getX(i)} cy={getY(val)} r={selectedDataPoint === i ? 6 : 0} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
                ))}

                {/* Labels */}
                {labels.map((l, i) => (
                    <SvgText key={i} x={getX(i)} y={chartHeight - 10} fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize={10} textAnchor="middle">{l.charAt(0)}</SvgText>
                ))}

                {/* Tooltip Line */}
                {selectedDataPoint !== null && (
                    <Line x1={getX(selectedDataPoint)} y1={paddingTop} x2={getX(selectedDataPoint)} y2={chartHeight - paddingBottom} stroke={colors.primary} strokeDasharray="2,2" />
                )}
            </Svg>
        );
    };

    // --- NEW ANALYTICS RENDERERS ---

    const renderSupermarketChart = () => {
        const bigCount = stats.supermarketVisits.filter(v => v.type === 'big').reduce((a, b) => a + b.count, 0);
        const smallCount = stats.supermarketVisits.filter(v => v.type === 'small').reduce((a, b) => a + b.count, 0);
        const total = bigCount + smallCount;
        const bigPct = (bigCount / total) * 100;

        return (
            <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : colors.white }]}>
                <Text style={[styles.cardTitle, { color: isDark ? colors.white : colors.textPrimary }]}>Onde você compra</Text>

                {/* Bar Chart */}
                <View style={styles.marketBarContainer}>
                    <View style={styles.marketLabels}>
                        <Text style={[styles.marketLabel, { color: colors.primary }]}>Atacadões ({Math.round(bigPct)}%)</Text>
                        <Text style={[styles.marketLabel, { color: colors.orange }]}>Mercadinhos ({Math.round(100 - bigPct)}%)</Text>
                    </View>
                    <View style={styles.marketBarBg}>
                        <View style={[styles.marketBarBig, { width: `${bigPct}%` }]} />
                        <View style={[styles.marketBarSmall, { width: `${100 - bigPct}%` }]} />
                    </View>
                </View>

                {/* Insight */}
                <View style={[styles.insightBox, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#ECFDF5' }]}>
                    <Zap color={colors.primary} size={20} />
                    <Text style={[styles.insightText, { color: isDark ? '#E5E7EB' : '#065F46' }]}>
                        Se comprasse tudo em atacadões, você economizaria cerca de <Text style={{ fontWeight: 'bold' }}>15%</Text> no final do mês!
                    </Text>
                </View>
            </View>
        );
    };

    // Resized & Enhanced Actions
    const quickActions = [
        { id: 'new-list', icon: <Plus color={colors.white} size={24} />, label: 'Nova Lista', route: '/lists', bg: colors.primary },
        { id: 'lists', icon: <ListIcon color={colors.white} size={24} />, label: 'Minhas Listas', route: '/lists', bg: colors.accent },
        { id: 'recipes', icon: <ChefHat color={colors.white} size={24} />, label: 'Receitas', route: '/recipes', bg: colors.warning },
        { id: 'achievements', icon: <Trophy color={colors.white} size={24} />, label: 'Conquistas', route: '/achievements', bg: colors.teal },
    ];

    const bgColor = isDark ? '#111827' : colors.background;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const cardColor = isDark ? '#1F2937' : colors.white;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Lucas'}!</Text>
                    <Text style={styles.headerTitle}>Análise de Gastos</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
                {/* Horizontal Quick Actions */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
                    {[
                        { id: 'new-list', icon: <Plus color={colors.white} size={20} />, label: 'Nova Lista', route: '/lists', bg: colors.primary },
                        { id: 'lists', icon: <ListIcon color={colors.white} size={20} />, label: 'Minhas Listas', route: '/lists', bg: colors.accent },
                        { id: 'recipes', icon: <ChefHat color={colors.white} size={20} />, label: 'Receitas', route: '/recipes', bg: colors.warning },
                        { id: 'group', icon: <Users color={colors.white} size={20} />, label: 'Modo Grupo', route: '/group', bg: '#4F46E5' },
                        { id: 'achievements', icon: <Trophy color={colors.white} size={20} />, label: 'Conquistas', route: '/achievements', bg: colors.teal },
                    ].map(action => (
                        <TouchableOpacity key={action.id} style={[styles.quickActionPill, { backgroundColor: action.bg }]} onPress={() => router.push(action.route as any)}>
                            {action.icon}
                            <Text style={styles.quickActionText}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Spending Summary Cards Row (Scrollable) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                            <TrendingUp color={colors.primary} size={18} />
                        </View>
                        <Text style={[styles.summaryLabel, { color: mutedColor }]}>Essa Semana</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>R$ {(stats.currentWeekSpent / 100).toFixed(2).replace('.', ',')}</Text>
                        <Text style={[styles.summaryChange, { color: colors.error }]}>+27% vs anterior</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                            <Calendar color={colors.accent} size={18} />
                        </View>
                        <Text style={[styles.summaryLabel, { color: mutedColor }]}>Mês Passado</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>R$ {(stats.lastMonthSpent / 100).toFixed(2).replace('.', ',')}</Text>
                        <Text style={[styles.summaryChange, { color: colors.success }]}>-12% vs média</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <ShoppingBag color={colors.warning} size={18} />
                        </View>
                        <Text style={[styles.summaryLabel, { color: mutedColor }]}>Ano (Comida)</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>R$ {(stats.yearSpentFood / 100).toFixed(0).replace('.', ',')}</Text>
                        <Text style={[styles.summaryChange, { color: mutedColor }]}>Total acumulado</Text>
                    </View>
                </ScrollView>

                {/* Charts Section */}
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Evolução Semanal</Text>
                        <TouchableOpacity onPress={() => { setChartPeriod(chartPeriod === 'week' ? 'month' : 'week'); setSelectedDataPoint(null); }}>
                            <Text style={{ color: colors.primary }}>{chartPeriod === 'week' ? 'Ver Mês' : 'Ver Semana'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View {...panResponder.panHandlers} style={{ alignItems: 'center' }}>
                        {renderLineChart()}
                        {selectedDataPoint !== null && (
                            <View style={[
                                styles.tooltipBox,
                                {
                                    left: getX(selectedDataPoint) + (chartWidth - graphWidth) / 2 - 50, // Centralizar tooltip de 100px
                                    top: getY(chartData.current[selectedDataPoint]) - 45,
                                    position: 'absolute'
                                }
                            ]}>
                                <Text style={styles.tooltipTitle}>{labels[selectedDataPoint]}</Text>
                                <Text style={styles.tooltipText}>R$ {(chartData.current[selectedDataPoint] || 0).toFixed(2)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* NEW Deep Analytics Section */}
                <View style={styles.insightsRow}>
                    {/* Daily Avg */}
                    <View style={[styles.insightCardSmall, { backgroundColor: cardColor }]}>
                        <View style={styles.insightHeader}>
                            <BarChart3 color={colors.info} size={20} />
                            <Text style={[styles.insightTitle, { color: mutedColor }]}>Média Diária</Text>
                        </View>
                        <Text style={[styles.insightValue, { color: textColor }]}>R$ {(stats.dailyAverage / 100).toFixed(2).replace('.', ',')}</Text>
                        <Text style={[styles.insightSub, { color: mutedColor }]}>Gasto por dia</Text>
                    </View>
                    {/* Projected */}
                    <View style={[styles.insightCardSmall, { backgroundColor: cardColor }]}>
                        <View style={styles.insightHeader}>
                            <Target color={colors.purple} size={20} />
                            <Text style={[styles.insightTitle, { color: mutedColor }]}>Projeção Mês</Text>
                        </View>
                        <Text style={[styles.insightValue, { color: textColor }]}>R$ {(stats.projectedMonthly / 100).toFixed(2).replace('.', ',')}</Text>
                        <Text style={[styles.insightSub, { color: mutedColor }]}>Estimativa final</Text>
                    </View>
                </View>

                {/* Product Insights */}
                <View style={styles.insightsRow}>
                    <View style={[styles.insightCardSmall, { backgroundColor: cardColor }]}>
                        <View style={styles.insightHeader}>
                            <Award color={colors.warning} size={20} />
                            <Text style={[styles.insightTitle, { color: mutedColor }]}>Mais Comprado</Text>
                        </View>
                        <Text style={[styles.insightValue, { color: textColor }]}>{stats.mostBoughtItem.name}</Text>
                        <Text style={[styles.insightSub, { color: mutedColor }]}>{stats.mostBoughtItem.count}x este mês</Text>
                    </View>
                    <View style={[styles.insightCardSmall, { backgroundColor: cardColor }]}>
                        <View style={styles.insightHeader}>
                            <DollarSign color={colors.error} size={20} />
                            <Text style={[styles.insightTitle, { color: mutedColor }]}>Mais Caro</Text>
                        </View>
                        <Text style={[styles.insightValue, { color: textColor }]}>{stats.mostExpensiveItem.name}</Text>
                        <Text style={[styles.insightSub, { color: mutedColor }]}>R$ {(stats.mostExpensiveItem.price / 100).toFixed(2).replace('.', ',')}</Text>
                    </View>
                </View>

                {/* Supermarket Frequency & Savings */}
                {renderSupermarketChart()}

                {/* Category Breakdown (Simple List for now) */}
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Gastos por Setor</Text>
                    {[{ n: 'Açougue', v: 45, c: colors.error }, { n: 'Hortifruti', v: 25, c: colors.success }, { n: 'Limpeza', v: 15, c: colors.accent }, { n: 'Outros', v: 15, c: mutedColor }].map((cat, i) => (
                        <View key={i} style={styles.catRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.c }} />
                                <Text style={{ color: textColor }}>{cat.n}</Text>
                            </View>
                            <Text style={{ fontWeight: 'bold', color: textColor }}>{cat.v}%</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>

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
    content: { flex: 1, padding: spacing.md },

    // Horizontal Quick Actions
    quickActionsScroll: { paddingHorizontal: spacing.xs, marginBottom: spacing.lg, gap: spacing.sm },
    quickActionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, marginRight: 8, ...shadows.sm, gap: 8 },
    quickActionText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },

    // Summary Cards
    summaryRow: { marginBottom: spacing.md, paddingHorizontal: spacing.xs },
    summaryCard: { width: 140, padding: spacing.md, borderRadius: borderRadius.lg, marginRight: spacing.md, ...shadows.sm },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    summaryLabel: { fontSize: fontSize.xs, fontWeight: '600' },
    summaryValue: { fontSize: fontSize.lg, fontWeight: 'bold', marginVertical: 2 },
    summaryChange: { fontSize: fontSize.xs, fontWeight: '500' },

    // Generic Card
    card: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md, ...shadows.sm },
    cardTitle: { fontSize: fontSize.md, fontWeight: 'bold', marginBottom: spacing.md },

    // Insights Row
    insightsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    insightCardSmall: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    insightTitle: { fontSize: fontSize.xs, textTransform: 'uppercase', fontWeight: 'bold' },
    insightValue: { fontSize: fontSize.md, fontWeight: 'bold', marginBottom: 2 },
    insightSub: { fontSize: fontSize.xs },

    // Market Chart
    marketBarContainer: { marginBottom: spacing.md },
    marketLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    marketLabel: { fontSize: fontSize.xs, fontWeight: '600' },
    marketBarBg: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
    marketBarBig: { backgroundColor: colors.primary, height: '100%' },
    marketBarSmall: { backgroundColor: colors.orange, height: '100%' },

    // Insight Box
    insightBox: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', gap: spacing.md },
    insightText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },

    // Chart
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, zIndex: 1 },
    tooltipBox: {
        width: 100,
        alignItems: 'center',
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 8,
        ...shadows.md,
        zIndex: 10,
    },
    tooltipTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    tooltipText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    // Categories
    catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }
});
