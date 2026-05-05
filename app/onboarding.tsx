import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: '⚽',
        title: 'Análise Estatística',
        subtitle: 'DATASCIENCE',
        description: 'Models preditivos treinados com miles de dados históricos. Análise deep learning para precisão maxima.',
        bgColors: ['#1A1A2E', '#C9A84C']
    },
    {
        id: '2',
        icon: '📊',
        title: 'Picks de Alta Confiança',
        subtitle: 'AI POWERED',
        description: 'Apenas picks com 65%+ de confiança. Média de acerto de 72% nos ultimos 30 dias.',
        bgColors: ['#16213E', '#0F3460']
    },
    {
        id: '3',
        icon: '🎯',
        title: 'Cobertura Global',
        subtitle: 'WORLDWIDE',
        description: 'Mais de 50 ligas worldwide. Premier League, La Liga, Serie A, Bundesliga, Brasileirão e mais.',
        bgColors: ['#0F3460', '#C9A84C']
    },
    {
        id: '4',
        icon: '💰',
        title: 'Freemium Acessível',
        subtitle: '2 FREE / DIA',
        description: '2 picks gratis diarios. Upgrade para Premium e receba ate 5 picks com 75%+ de confiança.',
        bgColors: ['#1A1A2E', '#16213E']
    },
    {
        id: '5',
        icon: '🚀',
        title: 'Vamos Começar?',
        subtitle: 'GOALEDGE',
        description: 'Junte-se a milhares de apostadores que confiam na nossa analise estatística.',
        bgColors: ['#C9A84C', '#B8922A']
    },
];

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { completeOnboarding } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = new Animated.Value(0);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await completeOnboarding();
        router.replace('/login');
    };

    const renderSlide = ({ item, index }: { item: typeof SLIDES[0], index: number }) => (
        <View style={styles.slide}>
            <LinearGradient
                colors={item.bgColors as any}
                style={styles.slideBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.contentContainer, { marginTop: insets.top + 60 }]}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.emoji}>{item.icon}</Text>
                    </View>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    const renderDots = () => {
        return (
            <View style={styles.paginationContainer}>
                {SLIDES.map((_, index) => {
                    const opacity = scrollX.interpolate({
                        inputRange: [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    const scale = scrollX.interpolate({
                        inputRange: [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ],
                        outputRange: [1, 1.25, 1],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { opacity, transform: [{ scale }] },
                                index === currentIndex ? styles.dotActive : null
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={(e) => {
                    const offsetX = e.nativeEvent.contentOffset.x;
                    scrollX.setValue(offsetX);
                }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
                {renderDots()}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Começar Agora' : 'Próximo'}
                    </Text>
                    {currentIndex !== SLIDES.length - 1 && <ChevronRight color="#1A1A2E" size={20} />}
                </TouchableOpacity>

                {currentIndex !== SLIDES.length - 1 && (
                    <TouchableOpacity onPress={handleComplete} style={styles.skipButton}>
                        <Text style={styles.skipText}>Pular introdução</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    slide: {
        width,
        height,
    },
    slideBackground: {
        flex: 1,
        paddingHorizontal: 32,
    },
    contentContainer: {
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    emoji: {
        fontSize: 48,
    },
    subtitle: {
        color: '#C9A84C',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 3,
    },
    title: {
        fontSize: 38,
        fontWeight: '900',
        color: 'white',
        marginBottom: 16,
        lineHeight: 46,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 24,
        maxWidth: '90%',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
    },
    paginationContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        backgroundColor: '#C9A84C',
    },
    button: {
        backgroundColor: '#C9A84C',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonText: {
        color: '#1A1A2E',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
});