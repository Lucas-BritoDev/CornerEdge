import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@goaledge_language';

const resources = {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pt',
        fallbackLng: 'pt',
        compatibilityJSON: 'v4',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export const loadSavedLanguage = async () => {
    try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
            await i18n.changeLanguage(savedLang);
        }
    } catch (error) {
        console.error('Error loading language:', error);
    }
};

export const changeLanguage = async (lang: string) => {
    try {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

export default i18n;