import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Detectar se está rodando no Expo Go (SDK 53+ removeu push notifications)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Carregar módulos de forma segura apenas fora do Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');

    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.log('[Notifications] Módulo não disponível');
    Notifications = null;
    Device = null;
  }
} else {
  console.log('[Notifications] Expo Go detectado — notificações push desabilitadas');
}

export function useNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>(undefined);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Não registrar no Expo Go ou sem userId
    if (!userId || !Notifications || !Device || isExpoGo) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) console.log('[Notifications] Erro ao salvar token:', error.message);
          });
      }
    });

    notificationListener.current = Notifications!.addNotificationReceivedListener(
      (notif: any) => setNotification(notif)
    );

    responseListener.current = Notifications!.addNotificationResponseReceivedListener(
      (response: any) => console.log('[Notifications] Response:', response)
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications || !Device || isExpoGo) return undefined;

  // Criar canal Android
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B00',
      });
    } catch (e) {
      console.log('[Notifications] Erro ao criar canal Android:', e);
    }
  }

  // Apenas em dispositivos físicos
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications requerem dispositivo físico');
    return undefined;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permissão negada');
      return undefined;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log('[Notifications] projectId não encontrado, pulando registro');
      return undefined;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Notifications] Token registrado com sucesso');
    return token;

  } catch (e) {
    console.log('[Notifications] Erro ao registrar token (normal em dev):', e);
    return undefined;
  }
}
