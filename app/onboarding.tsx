import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
    ImageBackground
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Check } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: '📝',
        title: 'Listas Inteligentes',
        subtitle: 'Organize suas compras',
        description: 'Crie listas de compras organizadas por categorias. Compartilhe com família e amigos via código.',
        bgColors: ['#4F46E5', '#818CF8']
    },
    {
        id: '2',
        icon: '💰',
        title: 'Controle de Orçamento',
        subtitle: 'Economize dinheiro',
        description: 'Defina um teto de gastos e veja o progresso em tempo real. Nunca mais estoure o orçamento!',
        bgColors: ['#059669', '#34D399']
    },
    {
        id: '3',
        icon: '🍳',
        title: 'Receitas Deliciosas',
        subtitle: 'Cozinhe com facilidade',
        description: 'Explore receitas e adicione ingredientes à sua lista com um toque. Filtros e favoritos incluídos.',
        bgColors: ['#EA580C', '#FB923C']
    },
    {
        id: '4',
        icon: '👥',
        title: 'Modo Grupo',
        subtitle: 'Sincronia total',
        description: 'Mural de recados, atividades em tempo real e listas compartilhadas com sua casa.',
        bgColors: ['#7C3AED', '#A78BFA']
    },
    {
        id: '5',
        icon: '🚀',
        title: 'Vamos Começar?',
        subtitle: 'Sua vida mais fácil',
        description: 'Junte-se a milhares de pessoas que já economizam tempo e dinheiro com nosso app.',
        bgColors: ['#2563EB', '#60A5FA']
    },
];

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { completeOnboarding } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

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
                    <Text style={styles.subtitle}>{item.subtitle.toUpperCase()}</Text>
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
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
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
                    {currentIndex !== SLIDES.length - 1 && <ChevronRight color="white" size={20} />}
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
        backgroundColor: '#000',
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    emoji: {
        fontSize: 40,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 2,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: 'white',
        marginBottom: 16,
        lineHeight: 48,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
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
        backgroundColor: 'white',
    },
    dotActive: {
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: 'white',
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
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
});
