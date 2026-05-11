import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

interface DateNavigatorProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

export function DateNavigator({ selectedDate, onDateChange, minDate, maxDate }: DateNavigatorProps) {
    const { colors } = useTheme();
    const { i18n } = useTranslation();

    const formatDate = (date: Date) => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
    };

    const navigateDate = (direction: 'next' | 'prev') => {
        const newDate = new Date(selectedDate);
        if (direction === 'next') {
            newDate.setDate(newDate.getDate() + 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        onDateChange(newDate);
    };

    const canGoNext = !maxDate || selectedDate < maxDate;
    const canGoPrev = !minDate || selectedDate > minDate;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <TouchableOpacity
                onPress={() => navigateDate('prev')}
                disabled={!canGoPrev}
                style={[styles.navButton, !canGoPrev && { opacity: 0.3 }]}
            >
                <ChevronLeft color={colors.accentOrange} size={24} />
            </TouchableOpacity>

            <View style={styles.dateDisplay}>
                <Calendar color={colors.accentOrange} size={18} />
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                    {formatDate(selectedDate)}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => navigateDate('next')}
                disabled={!canGoNext}
                style={[styles.navButton, !canGoNext && { opacity: 0.3 }]}
            >
                <ChevronRight color={colors.accentOrange} size={24} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginHorizontal: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
});
