import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
// import { LineChart, BarChart } from 'react-native-chart-kit'; // Commented out to avoid build errors if not linked properly yet, but logic is here.
// Validating chart kit existence first? User said "Installed". I'll use it.
import { LineChart, BarChart } from 'react-native-chart-kit';
import { analyticsService } from '../services/analytics-service';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const insights = await analyticsService.getInsights();
        setData(insights);
        setLoading(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <Header title="Insights" showBack />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Resumo Geral</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{data.totalLists}</Text>
                            <Text style={styles.statLabel}>Listas</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{data.totalItems}</Text>
                            <Text style={styles.statLabel}>Itens</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{data.completionRate.toFixed(0)}%</Text>
                            <Text style={styles.statLabel}>Conclusão</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{data.streak} 🔥</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Atividade Recente</Text>
                    <LineChart
                        data={{
                            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                            datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
                        }}
                        width={screenWidth - 64}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: "#fff",
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Categorias</Text>
                    <BarChart
                        data={{
                            labels: ["Alim.", "Limp.", "Horti.", "Bebid.", "Outros"],
                            datasets: [{ data: [20, 45, 28, 80, 99] }]
                        }}
                        width={screenWidth - 64}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: "#fff",
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        verticalLabelRotation={30}
                        style={{ marginVertical: 8 }}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});
